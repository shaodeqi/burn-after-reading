import { onUnmounted, ref } from "vue";

const online = ref(navigator.onLine);

const cb = () => {
  online.value = navigator.onLine;
};

export const listenNetwork = () => {
  globalThis.addEventListener("offline", cb);
  globalThis.addEventListener("online", cb);

  return () => {
    globalThis.removeEventListener("offline", cb);
    globalThis.removeEventListener("online", cb);
  };
};

onUnmounted(listenNetwork(cb));

export default online;
