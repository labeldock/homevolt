<template>
  <teleport to="#master-header-commands">
    <button class="neu-circle" @click="fetchHostList" :disabled="hosts.loading">
      <TextIcon type="refresh" />
    </button>
  </teleport>
  <div class="home-wrapper">
    <template v-if="hosts.loading">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="loader" size="24px" />
        </div>
        <div>
          사용 가능한 호스트를 찾고 있습니다.
        </div>
      </div>
    </template>
    <template v-else-if="!hosts.value.length">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="emotion-sad" size="24px" />
        </div>
        <div>
          사용 가능한 호스트가 없습니다.
        </div>
      </div>
    </template>
    <template v-else>
      <div class="hostbox">
        <div
          v-for="host in hosts.value"
          :key="host.offer"
          class="host-item neu-rect"
        >
          <header>
            <TextIcon type="play-circle" size="20px" color="green" />
          </header>
          <figure>
            <TextIcon type="server" size="80px" />
          </figure>
          <small>{{ host.address }}</small
          ><br />
          <small>{{ host.uuid }}</small>
          <p>{{ host.ready ? "준비됨" : "준비중" }}</p>
          <footer>
            <button class="neu-button" @click="selectHost(host.uuid)">
              연결하기
            </button>
          </footer>
        </div>
      </div>
    </template>
  </div>
  <div>
    <InfoIcon :os="deviceInfo.os" />
    <InfoIcon :browser="deviceInfo.browser" />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, onBeforeMount, reactive } from "vue";
import router from "@/router";
import axios from "axios";
import InfoIcon from "shared/components/InfoIcon.vue";
import TextIcon from "shared/components/TextIcon.vue";
import { DeviceInfoSymbol } from "shared/symbol";

export default defineComponent({
  name: "Home",
  components: {
    InfoIcon,
    TextIcon
  },
  setup() {
    const hosts = reactive({
      value: [],
      loading: false
    });

    const deviceInfo = inject(DeviceInfoSymbol);

    function fetchHostList() {
      hosts.loading = true;
      axios.get("/api/findhost").then(response => {
        hosts.value = response.data;
        hosts.loading = false;
      });
    }

    function selectHost(id: string) {
      router.push(`/host/${id}`);
    }

    onBeforeMount(() => {
      fetchHostList();
    });

    return {
      hosts,
      fetchHostList,
      selectHost,
      deviceInfo
    };
  }
});
</script>

<style lang="scss">
@import "~shared/assets/mixin";
.home-wrapper {
  position: relative;
  min-height: 60vh;
  .infobox {
    @include translate-center;
    padding: 40px;
  }
  .hostbox {
    @include flow(row, wrap, center);
    > .host-item {
      flex: 0 0 auto;
      width: 240px;
      height: 240px;
      position: relative;
      padding: 10px;
      > header {
        @include absolute(left, 10px, 10px);
      }
      > small {
        font-size: 10px;
      }
      > p {
        margin-top: 12px;
      }
      > footer {
        @include absolute(bottom, 10px, full);
      }
    }
  }
}
</style>
