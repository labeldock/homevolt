const Router = require("express");
const eventHelper = require("shared/eventHelper");

module.exports = serverState => {
  const router = Router();

  serverState.event = eventHelper();
  serverState.cacheStatus = {
    operate:JSON.stringify({ action: "operateStatus", operates:[] }),
    device:JSON.stringify({ action: "deviceStatus", devices:[] }),
  }
  
  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"Bridge", status:"ok", ready:true }
  });

  serverState.event.on("shouldBroadcastAllOperators",async ()=>{
    const operates = []
    await Promise.all(serverState.event.emit("shouldPullOperateStatus")).then(recives=>{
      recives.forEach((recive)=>{
        operates.push(recive)
      })
    })
    const sendData = { action: "operateStatus", operates }
    const sendContent = JSON.stringify(sendData)

    if(serverState.cacheStatus.operate !== sendContent){
      serverState.cacheStatus.operate = sendContent;
      serverState.event.emit("shouldSentDeviceStatusContent", sendContent)
    }
  });

  serverState.event.on("shouldBroadcastAllDevices",async ()=>{
    const info = {};
    const devices = [];
    await Promise.all(serverState.event.emit("shouldPullDevicesStatus")).then(recives=>{
      recives.forEach((reciveEntry)=>{
        const { name, value } = reciveEntry;
        info[name] = { name, operation:true, length:value.length }
        value.forEach((device)=>{
          devices.push(device)
        })
      })
    })
    const sendData = { action: "deviceStatus", info, devices }
    const sendContent = JSON.stringify(sendData)

    if(serverState.cacheStatus.device !== sendContent){
      serverState.cacheStatus.device = sendContent;
      serverState.event.emit("shouldSentDeviceStatusContent", sendContent)
    }
  })

  serverState.event.emit("shouldBroadcastAllOperators");

  return router
}