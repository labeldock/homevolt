const Router = require("express");
const eventHelper = require("shared/eventHelper");
//rtc
const { RTCPeerConnection } = require("wrtc");
//udp
const dgram = require("dgram");
const udpServer = dgram.createSocket("udp4");
const ticketBox = eventHelper();
let connectorsOrder = 0;

const {
  encode64,
  decode64,
  parseMessagePayload,
  removeValue
} = require("shared/functions");

const {
  deferralReference,
} = require("shared/promise")

module.exports = serverState => {
  const router = Router();
  const { UDP_PORT, UUID } = serverState;
  const connectors = [];
  
  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"UDP4(dgram)", status:"ok", ready:true }
  });

  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"NodeRTC", status:"ok", ready:true }
  });

  udpServer.on("error", err => {
    console.log(`udpServer error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on("listening", () => {
    const address = udpServer.address();
    console.log(`udpServer listening ${address.address}:${address.port}`);
  });

  udpServer.on("message", async (msg, rinfo) => {
    const { action, ...data } = parseMessagePayload(msg);
    console.log(
      `udpServer got: ${action} ${(msg + "").length}[${Object.keys(
        data
      )}] from ${rinfo.address}:${rinfo.port}`
    );
    if (action === "BROWSERTCHOST") {
      udpServer.send(
        JSON.stringify({
          action: "HOSTINFO",
          uuid: UUID
        }),
        rinfo.port,
        rinfo.address
      );
    }

    if (action === "REQUESTTICKET" && data.server === UUID) {
      const browser_id = data.sender;
      const deferralOffer = deferralReference(null);
      const deferralIceCandidates = deferralReference([]).use(({ finish }) => {
        setTimeout(finish, 2500);
      });

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
        optional: [
          {
            RtpDataChannels: true
          }
        ]
      });

      pc.onnegotiationneeded = () => {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          deferralOffer.finish(() => offer);
        });
      };

      pc.onicecandidate = function(event) {
        if (event.candidate !== null) {
          deferralIceCandidates.value.push(event.candidate);
        } else {
          deferralIceCandidates.finish();
        }
      };

      pc.oniceconnectionstatechange = function() {
        if (pc.iceConnectionState == "disconnected") {
          onDisconnectPeerConnection();
        }
      };

      const broadcaster = Object.defineProperties(
        {
          type: "browser",
          device_id: browser_id,
          browser_id,
          connection_id: connectorsOrder++,
          connected_at: null,
          handshake: false, // 양측이 상대 연결 정보를 취득한 상태
          connected: false, // 정상적으로 연결이 된 상태
          meta: {},
        },
        {
          send: {
            enumerable: false,
            configurable: false,
            value: data => {
              broadcaster.connected && dc.send(data);
            }
          }
        }
      );

      function onDisconnectPeerConnection() {
        dc.close();
        pc.close();
        removeValue(connectors, broadcaster);
        serverState.event.emit("shouldBroadcastAllDevices");
      }

      const dc = pc.createDataChannel("raspi-iot-data", { reliable: false });

      dc.onopen = function() {
        broadcaster.connected = true;
        broadcaster.connected_at = Date.now();
        serverState.event.emit("shouldBroadcastAllDevices");
      };

      dc.onmessage = function({ data: msg }) {
        const { action, ...data } = parseMessagePayload(msg);
        if (action === "disconnect") {
          onDisconnectPeerConnection();
        }
      };

      const ticket = ticketBox.ticket(function({ answer, candidates, meta }) {
        const answerData = JSON.parse(decode64(answer));
        const candidatesData = JSON.parse(decode64(candidates));
        candidatesData.forEach(candidate => {
          pc.addIceCandidate(candidate);
        });
        pc.setRemoteDescription(answerData);
        //
        broadcaster.handshake = true;
        broadcaster.meta = meta;
        serverState.event.emit("shouldBroadcastAllDevices");
      });

      connectors.push(broadcaster);
      serverState.event.emit("shouldBroadcastAllDevices");

      await Promise.all([
        deferralOffer.promise,
        deferralIceCandidates.promise
      ]).then(function([resultOfOffer, resultOfCandidates]) {
        const offer = encode64(JSON.stringify(resultOfOffer));
        const candidates = encode64(JSON.stringify(resultOfCandidates));
        udpServer.send(
          JSON.stringify({
            action: "PUBLISHEDTICKET",
            ticket,
            offer,
            candidates
          }),
          rinfo.port,
          rinfo.address
        );
      });
    }

    if (action === "ANSWER") {
      ticketBox.emit(data.ticket, data);
    }
  });


  // connectors
  serverState.event.on("shouldPullDevicesStatus", ()=>{
    return {
      name:"connectors",
      value:[...connectors]
    }
  })

  // rtc (to client)
  serverState.event.on("shouldSentDeviceStatusContent", (deviceStatus)=>{
    connectors.forEach(broadcaster => {
      broadcaster.send(deviceStatus);
    });
  })
  
  udpServer.bind({ port: UDP_PORT, exclusive: false });

  serverState.event.emit("shouldBroadcastAllOperators");

  return router;
};
