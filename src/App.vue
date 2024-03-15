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
      class="network-status position-absolute"
      :class="NETWORK_STATUS[networkState]"
    >
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path
          d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z"
        />
        <path
          d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.473 6.473 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.478 5.478 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091l.016-.015zM9.06 12.44c.196-.196.198-.52-.04-.66A1.99 1.99 0 0 0 8 11.5a1.99 1.99 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z"
        />
      </svg>
    </div>
    <v-divider></v-divider>
    <div
      class="d-flex flex-column flex-1-1 pa-3 overflow-auto dialogs-container"
      ref="dialogsContainer"
    >
      <TransitionGroup name="dialog">
        <template v-for="(dialog, dIndex) in dialogs" :key="dialog.id">
          <div
            v-if="dialog.type === 'text'"
            :class="[own(dialog) ? 'align-self-end' : 'align-self-start']"
            style="max-width: 90%"
            @click="handleRead(dialog, dIndex)"
          >
            <div
              class="text-medium-emphasis text-body-2"
              :class="[own(dialog) ? 'text-right' : 'text-left']"
            >
              <span
                v-if="dialog.timestamp && own(dialog)"
                class="text-body-2 text-grey-lighten-1"
                >{{ new Date(dialog.timestamp).toLocaleString() }}</span
              >
              {{ dialog.nick }}
              <span
                v-if="dialog.timestamp && !own(dialog)"
                class="text-body-2 text-grey-lighten-1"
                >{{ new Date(dialog.timestamp).toLocaleString() }}</span
              >
            </div>
            <v-badge
              color="red-lighten-1"
              :model-value="badge(dialog)"
              :content="dialog.countDown"
              :dot="dot(dialog)"
              :location="own(dialog) ? 'top start' : 'top end'"
              :class="[own(dialog) ? 'float-right own' : 'float-left']"
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
          <div v-if="dialog.type === 'state.enter'" class="align-self-center">
            <span class="text-body-2 text-grey-darken-1"
              >{{ dialog.message }}进入房间</span
            >
          </div>
          <div v-if="dialog.type === 'state.leave'" class="align-self-center">
            <span class="text-body-2 text-grey-darken-1"
              >{{ dialog.message }}离开房间</span
            >
          </div>
        </template>
      </TransitionGroup>
    </div>
    <v-divider></v-divider>
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
      >
        <!-- <template #append>
        <input ref="imageInput" @change="handleSendImage" style="display: none;" type="file" accept="image/*" capture="camera">
        <v-icon @click="handleChooseImage" icon="mdi-image"></v-icon>
      </template> -->
      </v-textarea>
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
        label="请输入昵称后 ↵ 进入"
        v-model="nick"
        enterkeyhint="go"
        @keydown.enter="handleNick"
      ></v-text-field>
    </div>
  </div>
  <v-overlay
    :model-value="true"
    :persistent="true"
    contained
    class="align-center justify-center"
  >
    <v-window
      :model-value="room === 'dududu'"
      show-arrows
      style="width: 80vw; max-width: 80vh"
    >
      <v-window-item>
        <v-card class="d-flex flex-column justify-center align-center py-10">
          <!-- <div class="pb-10">点击消息进行阅读，倒计时完成时销毁</div> -->
          <!-- <img
            style="width: 50vw; min-height: 108vw"
            src="./assets/guide.webp"
            alt="使用说明"
          /> -->
          <img style="width: 50vw" src="./assets/pay.webp" alt="" />
        </v-card>
      </v-window-item>
      <!-- <v-window-item>
        <v-card class="d-flex flex-column justify-center align-center py-10">
          <div class="pb-10">
            开启<span class="font-weight-black">浮窗</span>模式体验更佳
          </div>
          <img
            style="width: 50vw; min-height: 108vw"
            src="./assets/float.webp"
            alt="浮窗模式"
          />
        </v-card>
      </v-window-item> -->
    </v-window>
  </v-overlay>
  <v-snackbar
    location="top"
    color="red-lighten-1"
    timeout="3000"
    v-model="snackbar.visible"
    >{{ snackbar.content }}</v-snackbar
  >
  <!-- <img width="0" height="0" src="./assets/guide.webp" />
  <img width="0" height="0" src="./assets/float.webp" /> -->
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from "vue";
import md5 from "blueimp-md5";
import Compressor from "compressorjs";
import {
  notify,
  dialogState,
  randomString,
  handleMessageData,
  HASH,
  WS_ORIGIN,
  CLOSE_COOLING_MS,
  NETWORK_STATUS,
} from "@/utils";
import listenVisualViewport from "@/compositions/visual-viewport";
import online from "@/compositions/network";

import ReconnectingWebSocket from "reconnecting-websocket";

const inWeiXin = navigator.userAgent.toLowerCase().includes("micromessenger");
const searchParams = new URLSearchParams(location.search);
const loading = reactive({
  nick: false,
});
const snackbar = reactive({
  visible: false,
  content: "",
});
const overlay = ref(true);
const dialogsContainer = ref();
const imageInput = ref(null);
const message = ref("");
const nick = ref("");
const dialogs = ref([]);
const connected = ref(false);
const connectState = ref(ReconnectingWebSocket.CLOSED);
let wsOrigin = WS_ORIGIN;
let hash = HASH;
let room = searchParams.get("room");
let socket;
let justClosedUser;

if (!room) {
  room = "public";
  searchParams.set("room", room);
  location.search = searchParams.toString();
}
document.title = room;

if (location.host === "127.0.0.1:3001") {
  hash = "b793bde3f67ae928d93dc96fa16f2b93";
  // wsOrigin = "ws://127.0.0.1:9000";
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

const resetConnectState = () => {
  connectState.value = socket?.readyState ?? ReconnectingWebSocket.CLOSED;
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
  resetConnectState();
  socket.onopen = () => {
    loading.nick = false;
    connected.value = true;
    // if (isFirst && inWeiXin) {
    //   overlay.value = true;
    // }

    resetConnectState();
    sendMessage("message.get", undefined, [nick.value]);
  };
  socket.onclose = ({ reason }) => {
    resetConnectState();
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
    resetConnectState();
    const payload = await handleMessageData(originData);
    let { cmd, data, user, timestamp } = payload;
    switch (cmd) {
      case "connect":
        if (justClosedUser === user) {
          dialogs.value.pop();
        }

        if (
          dialogs.value[dialogs.value.length - 1]?.type === "state.enter" &&
          dialogs.value[dialogs.value.length - 1]?.message === user
        ) {
          return;
        }

        dialogs.value.push({
          type: "state.enter",
          message: user,
        });
        break;

      case "close":
        justClosedUser = user;
        setTimeout(() => {
          justClosedUser = "";
        }, CLOSE_COOLING_MS);
        dialogs.value.push({
          type: "state.leave",
          message: user,
        });
        break;
      case "send":
        switch (data?.type) {
          case "message.get":
            if (data.content instanceof Array) {
              dialogs.value = [
                dialogs.value.filter((d) => d.countDown > 0),
                ...data.content,
              ];
            }
            scrollToBottom();
            break;

          case "message.new":
            dialogs.value.push({ ...data.content, timestamp });

            if (data.content.nick && data.content.nick !== nick.value) {
              notify(room, data.content.message);
            }

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
  localStorage.setItem("chat.nick", nick.value);
  connect();
};

const handleChooseImage = () => {
  imageInput.value.click();
};

const handleSendImage = (e) => {
  console.log(imageInput.value.files);
  if (imageInput.value.files.length) {
    new Compressor(imageInput.value.files[0], {
      maxWidth: 960,
      maxHeight: 1200,
      convertSize: 100000,
      success(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.addEventListener(
          "load",
          () => {
            // convert image file to base64 string
            console.log(reader.result);
          },
          false
        );
      },
    });
  }
};

const localNick = localStorage.getItem("chat.nick");
if (localNick) {
  nick.value = localNick;
  connect();
}

const handleRead = (dialog) => {
  if (own(dialog) || dialog.state !== dialogState.UNREAD) {
    return;
  }

  sendMessage("message.read", dialog.id);
};

const countDown = (id) => {
  const dialog = dialogs.value.find((dialog) => dialog.id === id);
  if (!dialog) {
    return;
  }
  dialog.countDown = 20;
  dialog.state = dialogState.READING;
  const main = () => {
    setTimeout(() => {
      if (dialog.countDown > 0) {
        dialog.countDown--;
        main();
      } else {
        const dIndex = dialogs.value.findIndex((dialog) => dialog.id === id);
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
const networkState = computed(() =>
  online.value ? connectState.value : ReconnectingWebSocket.CLOSED
);

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
.network-status {
  &.online {
    color: #67c23a;
  }
  &.offline {
    color: #f56c6c;
    &::after {
      content: "╲";
      position: absolute;
      left: 0;
      bottom: 0;
    }
  }
  &.connecting {
    color: #409eff;
    animation: opacity-change 1s alternate infinite;
  }
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
