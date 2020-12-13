const Router = require("express");
const SSE = require('express-sse')
const sse = new SSE([JSON.stringify({ action:"iotStatus", devices:[] })]);

module.exports = serverState => {
  const router = Router();

  router.get("/api/connections/sse", (...args)=>{
    sse.init(...args);
  })

  // sse (to host)
  serverState.event.on("shouldSentDeviceStatusContent", (iotStatus)=>{
    sse.updateInit(iotStatus)
    sse.send(iotStatus)
  })

  return router
}