import { onBeforeMount, onUnmounted, onMounted, onBeforeUnmount } from "vue";

export function useEffect(fn) {
  let destroyFn = null;
  onBeforeMount(() => {
    destroyFn = fn();
  });
  onUnmounted(() => {
    typeof destroyFn === "function" && destroyFn();
  });
}

export function useLayoutEffect(fn) {
  let destroyFn = null;
  onMounted(() => {
    destroyFn = fn();
  });
  onBeforeUnmount(() => {
    typeof destroyFn === "function" && destroyFn();
  });
}
