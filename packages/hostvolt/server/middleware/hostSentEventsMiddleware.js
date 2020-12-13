const Router = require("express");
const SSE = require('express-sse')

const serverSentDeviceStatus = new SSE([JSON.stringify({ action:"deviceStatus", devices:[] })]);

module.exports = serverState => {
  const router = Router();

  router.get("/api/operate/sse", (...args)=>{
    serverSentDeviceStatus.init(...args);
  })

  router.get("/api/devices/sse", (...args)=>{
    serverSentDeviceStatus.init(...args);
  })

  // serverSentDeviceStatus (to host)
  serverState.event.on("shouldSentDeviceStatusContent", (deviceStatus)=>{
    serverSentDeviceStatus.updateInit(deviceStatus)
    serverSentDeviceStatus.send(deviceStatus)
  })

  return router
}