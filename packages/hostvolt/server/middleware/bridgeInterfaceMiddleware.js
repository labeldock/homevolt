const Router = require("express");
const eventHelper = require("shared/eventHelper");

module.exports = serverState => {
  const router = Router();

  serverState.event = eventHelper();
  serverState.operateStatus = [
    {name:"bridge", status:"ok", ready:true }
  ];

  let prevStatus = null;
  serverState.event.on("shouldBroadcastAllMonitors",async ()=>{
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

    if(prevStatus !== sendContent){
      prevStatus = sendContent;
      serverState.event.emit("shouldSentDeviceStatusContent", sendContent)
    }
  })

  return router
}