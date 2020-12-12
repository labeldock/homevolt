<template>
  <header class="master-header">
    <div class="brand">
      <div>IOT-PEER</div>
      <small>{{ browserId }}</small>
    </div>
    <div id="master-header-commands" class="commands">
      <button class="neu-button-circle" @click="toggleFullscreen()">
        <TextIcon :type="isFullscreen ? 'fullscreen-exit' : 'fullscreen'" />
      </button>
    </div>
  </header>
  <main>
    <template v-if="serviceReady === false">
      <div class="neu-rect">서비스 준비중 입니다.</div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </main>
</template>
<script>
import { defineComponent, onBeforeMount, provide, ref } from "vue";
import Detector from "detector-js";
import TextIcon from "shared/components/TextIcon.vue";
import { generateUUID } from "shared/functions";
import { useEffect } from "shared/hooks";
import { BrowserIdSymbol, DeviceInfoSymbol } from "shared/symbol";

export default defineComponent({
  components: {
    TextIcon
  },
  setup() {
    const browserId = ref();
    const deviceInfo = ref();
    const serviceReady = ref(false);

    provide(BrowserIdSymbol, browserId);
    provide(DeviceInfoSymbol, deviceInfo);

    onBeforeMount(() => {
      browserId.value = generateUUID();
      deviceInfo.value = { ...new Detector(navigator.appVersion) };
      serviceReady.value = true;
    });

    function getFullscreenState() {
      return (
        document.fullScreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen
      );
    }

    const isFullscreen = ref(getFullscreenState());

    useEffect(() => {
      function handleFullscreenChange() {
        const fullscreenState = getFullscreenState();
        isFullscreen.value = fullscreenState;
      }
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    });

    function toggleFullscreen() {
      if (isFullscreen.value) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
    return {
      browserId,
      serviceReady,
      isFullscreen,
      toggleFullscreen
    };
  }
});
</script>
<style lang="scss" scoped>
@import "~shared/assets/mixin";
.master-header {
  height: 80px;
  .brand {
    @include absolute(left, 20px, 50%);
    transform: translate(0px, -50%);
    text-align: left;
    small {
      font-size: 8px;
    }
  }
  .commands {
    @include flow();
    @include absolute(right, 20px, 50%);
    transform: translate(0px, -50%);
  }
  margin-bottom: 20px;
}
main {
  margin: 0 20px;
}
</style>
