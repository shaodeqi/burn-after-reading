<template>
  <div
    class="d-flex flex-column fill-height"
    :style="{
      filter: connected ? 'unset' : 'blur(10px)',
    }"
  >
    <!-- <div class="d-flex align-center justify-center px-1 py-2 header-container">
      <span>1</span>
      <span style="position: absolute; right: 12px">设置</span>
    </div> -->
    <div
      class="d-flex flex-column flex-1-1 pa-3 overflow-auto dialogs-container"
      ref="dialogsContainer"
    >
      <TransitionGroup name="dialog">
        <div
          v-for="(dialog, dIndex) in dialogs"
          :key="dialog.id"
          :class="[own(dialog) ? 'align-self-end' : 'align-self-start']"
          style="max-width: 90%"
          @click="handleRead(dialog, dIndex)"
        >
          <div
            class="text-medium-emphasis text-body-2"
            :class="[own(dialog) ? 'text-right' : 'text-left']"
          >
            {{ dialog.nick }}
          </div>
          <v-badge
            color="red-lighten-1"
            :model-value="badge(dialog)"
            :content="dialog.countDown"
            :dot="dot(dialog)"
            :location="own(dialog) ? 'top start' : 'top end'"
            :class="{ own: own(dialog) }"
            class="mb-4 px-1 rounded dialog-badge"
          >
            <div
              style="white-space: break-spaces"
              class="px-1 py-2 dialog"
              :class="{
                blur: blur(dialog),
              }"
            >
              {{ dialog.message }}
            </div>
          </v-badge>
        </div>
      </TransitionGroup>
    </div>
    <div class="d-flex px-4 py-2 pb-5 input-container bg-grey-lighten-4">
      <v-textarea
        @focus="scrollToBottom()"
        @input="scrollToBottom()"
        @keydown.enter="handleEnter"
        :autofocus="true"
        base-color="white"
        bg-color="white"
        theme="white"
        maxlength="300"
        enterkeyhint="send"
        v-model="message"
        auto-grow
        variant="outlined"
        hide-details
        rows="1"
      ></v-textarea>
    </div>
  </div>
  <div
    class="d-flex flex-column align-center fill-height w-100"
    style="position: absolute"
    v-if="!connected"
  >
    <div class="w-75">
      <v-text-field
        class="mt-16"
        :loading="loading.nick"
        label="请输入昵称"
        v-model="nick"
        enterkeyhint="done"
        @keydown.enter="handleNick"
      ></v-text-field>
    </div>
  </div>
  <v-snackbar
    location="top"
    color="red-lighten-1"
    timeout="3000"
    v-model="snackbar.visible"
    >{{ snackbar.content }}</v-snackbar
  >
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from "vue";
import md5 from "blueimp-md5";
import {
  dialogState,
  randomString,
  handleMessageData,
  HASH,
  WS_ORIGIN,
} from "@/utils";
import listenVisualViewport from "@/compositions/visual-viewport";
import ReconnectingWebSocket from "reconnecting-websocket";

const searchParams = new URLSearchParams(location.search);
const loading = reactive({
  nick: false,
});
const snackbar = reactive({
  visible: false,
  content: "",
});
const dialogsContainer = ref();
const message = ref("");
const nick = ref("");
const dialogs = ref([]);
const connected = ref(false);
let wsOrigin = WS_ORIGIN;
let hash = HASH;
let room = searchParams.get("room");
let socket;

if (!room) {
  room = randomString(16);
  searchParams.set("room", room);
  location.search = searchParams.toString();
}

if (location.host === "127.0.0.1:3001") {
  hash = "b793bde3f67ae928d93dc96fa16f2b93";
  wsOrigin = "ws://127.0.0.1:9000";
}

const scrollToBottom = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      dialogsContainer.value?.scrollTo({
        top: dialogsContainer.value.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };
})();

listenVisualViewport(scrollToBottom);

const sendMessage = (type, content, users = []) => {
  socket?.send(
    JSON.stringify({
      users,
      cmd: "send",
      data: {
        type,
        content,
      },
    })
  );
};

const handleEnter = (event) => {
  const value = event.target.value;
  if (!value) {
    return;
  }
  message.value = "";
  sendMessage("message.new", {
    type: "text",
    message: value,
    nick: nick.value,
    state: dialogState.UNREAD,
    countDown: 0,
    id: randomString(16),
  });

  event.preventDefault();
};

const connect = () => {
  loading.nick = true;
  socket = new ReconnectingWebSocket(
    `${wsOrigin}?room=${room}&user=${nick.value}&key=${md5(
      `${hash}@${room}@${nick.value}`
    )}`,
    undefined,
    {
      maxRetries: 5,
    }
  );
  socket.onopen = () => {
    loading.nick = false;
    connected.value = true;
    sendMessage("message.get", undefined, [nick.value]);
  };
  socket.onclose = ({ reason }) => {
    switch (reason) {
      case "duplicate":
        snackbar.content = "昵称重复，请重新输入！";
        snackbar.visible = true;
        connected.value = false;
        socket.close();
        break;
      default:
        break;
    }
  };
  socket.onmessage = async ({ data: originData }) => {
    const payload = await handleMessageData(originData);
    let { cmd, data } = payload;
    switch (cmd) {
      case "send":
        switch (data?.type) {
          case "message.get":
            if (data.content instanceof Array) {
              dialogs.value = data.content;
            }
            scrollToBottom();
            break;

          case "message.new":
            dialogs.value.push(data.content);
            scrollToBottom();
            break;

          case "message.read":
            countDown(data.content);
            break;
        }
    }
  };
};

const handleNick = (event) => {
  const inputNick = event.target.value;
  if (!inputNick) {
    return;
  }
  nick.value = inputNick;
  sessionStorage.setItem("chat.nick", nick.value);
  connect();
};

let sessionNick = sessionStorage.getItem("chat.nick");
if (sessionNick) {
  nick.value = sessionNick;
  connect();
}

const handleRead = (dialog) => {
  if (own(dialog) || dialog.state !== dialogState.UNREAD) {
    return;
  }

  sendMessage("message.read", dialog.id);
};

const countDown = (id) => {
  const dIndex = dialogs.value.findIndex((dialog) => dialog.id === id);

  if (dIndex === -1) {
    return;
  }

  const dialog = dialogs.value[dIndex];
  dialog.countDown = Math.min(20, Math.ceil(dialog.message.length / 2));
  dialog.state = dialogState.READING;
  const main = () => {
    setTimeout(() => {
      if (dialog.countDown > 0) {
        dialog.countDown--;
        main();
      } else {
        dialogs.value.splice(dIndex, 1);
      }
    }, 1000);
  };
  main();
};

const own = (dialog) => dialog.nick === nick.value;
const dot = (dialog) => dialog.state === dialogState.UNREAD;
const badge = (dialog) => dialog.state !== dialogState.READ;
const blur = (dialog) => !own(dialog) && dialog.state === dialogState.UNREAD;

onMounted(() => {
  nextTick(() => {
    scrollToBottom();
  });
});
</script>
<style lang="scss">
html,
body,
#app {
  height: 100%;
  // filter: blur(10px);
}
</style>
<style lang="scss" scoped>
.dialogs-container {
  border-top: 0.5px solid #e1e1e1;
  border-bottom: 0.5px solid #e1e1e1;
}
.dialog-badge {
  background-color: #fff;
  &.own {
    background-color: #abeb7b;
  }
}
.dialog {
  word-break: break-word;
  line-height: 1.5;
  &.blur {
    filter: blur(6px);
  }
}
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.5s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
