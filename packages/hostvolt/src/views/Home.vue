<template>
  <div class="home-wrapper">
    <template v-if="deviceStatus.error">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="emotion-sad" size="24px" />
        </div>
        <div>
          이런! 무언가 잘못되었군요
        </div>
        <div>
          {{ deviceStatus.error.message }}
        </div>
        <div>
          <router-link to="/">
            목록으로 돌아가기
          </router-link>
        </div>
      </div>
    </template>
    <template v-else-if="deviceStatus.opened === false">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="loader" size="24px" />
        </div>
        <div>
          서버와 연결 중입니다.
        </div>
      </div>
    </template>
    <template v-else>
      <div class="infobox neu-rect">
        <h3>호스트현황</h3>
        <template v-if="!deviceStatus.value || !deviceStatus.value.length">
          <div class="neu-rect" style="padding:20px;margin-top:20px;">
            이 장비와 연결된 장치가 없습니다.
          </div>
        </template>
        <template v-else>
          <table>
            <thead>
              <tr>
                <th>장비타입</th>
                <td>정보</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(device, index) in deviceStatus.value" :key="`device-${device.order}`">
                <td>{{ device.type }}</td>
                <td>{{ device }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, reactive, ref } from "vue";
import TextIcon from "shared/components/TextIcon.vue";
const { parseMessagePayload } = require("shared/functions");

export default defineComponent({
  name: "Home",
  components: {
    TextIcon
  },
  setup (){
    const deviceStatus = reactive({
      value:[],
      opened:false,
      error:null
    })

    onBeforeMount(()=>{
      const severEvents = new EventSource(`api/connections/sse`);
      console.log("severEvents", severEvents)
      
      severEvents.onopen = (event)=>{
        deviceStatus.opened = true;
      }

      severEvents.onmessage = ({ data: content })=>{
        const { action, ...data } = parseMessagePayload(parseMessagePayload(content))
        if(action === "iotStatus"){
          deviceStatus.value = data.devices;
        }
      }

      severEvents.onerror = (error)=>{
        deviceStatus.error = error as any
      }      
    })

    return {
      deviceStatus
    }
  }
});
</script>

<style lang="scss">
@import "~/shared/assets/mixin";
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
