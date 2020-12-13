<template>
  <div class="host-wrapper">
    <teleport to="#master-header-commands">
      <button class="neu-circle" @click="$router.push('/')">
        <TextIcon type="home" />
      </button>
    </teleport>
    <template v-if="host.error">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="emotion-sad" size="24px" />
        </div>
        <div>
          이런! 무언가 잘못되었군요
        </div>
        <div>
          {{ host.error.message }}
        </div>
        <div>
          <router-link to="/">
            목록으로 돌아가기
          </router-link>
        </div>
      </div>
    </template>
    <template v-else-if="host.hostinfoLoaded === false">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="window" size="36px" />
          <TextIcon type="arrow-left-right" size="36px" />
          <TextIcon type="information" size="36px" />
        </div>
        <div>
          호스트 정보를 불러오고 있습니다.
        </div>
      </div>
    </template>
    <template v-else-if="host.answered === false">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="cast" size="36px" />
          <TextIcon type="arrow-left-right" size="36px" />
          <TextIcon type="router" size="36px" />
        </div>
        <div>
          호스트와 연결중입니다.
        </div>
      </div>
    </template>
    <template v-else-if="host.connected === false">
      <div class="infobox neu-rect">
        <div>
          <TextIcon type="cloud" size="36px" />
          <TextIcon type="wireless-charging" size="36px" />
          <TextIcon type="cloud" size="36px" />
        </div>
        <div>
          호스트 응답을 기다리고 있습니다.
        </div>
      </div>
    </template>
    <template v-else>
      <div class="devices-flow">
        <div
          v-for="device in deviceStatus"
          :key="`device-${device.order}`"
          class="device-item neu-rect"
        >
          <header>
            <div>
              <TextIcon type="radar" size="60px" />
            </div>
            {{ device.type }}({{ device.order }})
            <div>연결시간 : {{ device.connected_at }}</div>
          </header>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  inject,
  onBeforeMount,
  onBeforeUnmount,
  reactive,
  ref
} from "vue";
import router from "@/router";
import axios from "axios";
import TextIcon from "shared/components/TextIcon.vue";
import { DeviceInfoSymbol } from "shared/symbol";
const { parseMessagePayload } = require("shared/functions");

export default defineComponent({
  name: "Host",
  components: {
    TextIcon
  },
  setup() {
    const host = reactive({
      value: null,
      hostinfoLoaded: false,
      answered: false,
      connected: false,
      error: null
    });

    const deviceInfo = inject(DeviceInfoSymbol);
    const deviceStatus = ref([]);

    const peerConnection = ref(null);
    const dataChannel = ref(null);

    onBeforeUnmount(() => {
      const maybePC: any = peerConnection.value;
      const maybeDC: any = dataChannel.value;
      if (maybeDC) {
        maybeDC.send(
          JSON.stringify({
            action: "disconnect",
            reason: "unmount"
          })
        );
        console.log("send disconnect");
        setTimeout(() => {
          maybeDC.close();
          console.log("dc close");
        }, 100);
      }
      if (maybePC) {
        setTimeout(() => {
          maybePC.close();
          console.log("pc close");
        }, 200);
      }
    });

    onBeforeMount(() => {
      const { host_id } = router.currentRoute.value.params;
      axios
        .get(`/api/ticket/${host_id}`)
        .then(async ({ data }) => {
          host.hostinfoLoaded = true;
          const { ticket, offer, candidates } = data;

          const hostOffer = JSON.parse(atob(offer));
          const hostCandidateList = JSON.parse(atob(candidates));
          const answerIceCandidates: any[] = [];

          const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.stunprotocol.org" }]
          });
          peerConnection.value = pc as any;

          pc.onicecandidate = event => {
            if (event.candidate) {
              answerIceCandidates.push(event.candidate);
            }
          };

          pc.setRemoteDescription(hostOffer);

          hostCandidateList.forEach((hostCandidate: any) => {
            pc.addIceCandidate(hostCandidate);
          });

          const answer = await pc.createAnswer();
          pc.setLocalDescription(answer);

          await new Promise(function(resolve) {
            setTimeout(resolve, 1000);
          });

          const encodeAnswer = btoa(JSON.stringify(answer));
          const encodeCandidates = btoa(JSON.stringify(answerIceCandidates));

          pc.ondatachannel = function(event) {
            const dc = event.channel;

            dc.onopen = function() {
              host.connected = true;
              dc.send(JSON.stringify({ action: "handshake" }));
            };

            dc.onmessage = function({ data: content }) {
              const { action, ...data } = parseMessagePayload(content);
              if (action === "deviceStatus") {
                deviceStatus.value = data.devices;
              }
              console.log("dc onmessage", action, data);
            };

            dataChannel.value = dc as any;

            window.addEventListener("unload", function() {
              dc.send(
                JSON.stringify({
                  action: "disconnect",
                  reason: "unload"
                })
              );
              dc.close();
              pc.close();
            });
          };

          // 세션 협상이 필요한 변경이 발생하면 트리거 됨
          pc.onnegotiationneeded = () => {
            pc.createOffer().then(desc => {
              //console.log("createOffer desc", desc)
              pc.setLocalDescription(desc);
            });
          };

          try {
            await axios.post(`/api/answer/${host_id}`, {
              deviceId: deviceInfo,
              ticket: ticket,
              answer: encodeAnswer,
              candidates: encodeCandidates
            });
            host.answered = true;
          } catch (error) {
            throw error;
          }
        })
        .catch(error => {
          host.error = error;
        });
    });

    return {
      host,
      deviceStatus
    };
  }
});
</script>

<style lang="scss">
@import "~shared/assets/mixin";
.host-wrapper {
  position: relative;
  min-height: 60vh;
  .infobox {
    @include translate-center;
    padding: 40px;
  }
  .devices-flow {
    margin-top: 40px;
    @include flow(row, wrap, center);
    > .device-item {
      flex: 0 0 auto;
      width: 160px;
      height: 160px;
      position: relative;
      padding: 10px;
      + .device-item {
        margin-left: 20px;
      }
    }
  }
}
</style>
