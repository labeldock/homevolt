const Router = require("express");
const SSE = require('express-sse')


module.exports = serverState => {
  const router = Router();

  
  function readHostStatus (){
    return JSON.stringify(Object.assign(
      JSON.parse(serverState.cacheStatus.operate),
      JSON.parse(serverState.cacheStatus.device),
      { action:"hostStatus" },
    ))
  }

  const serverSentOperateStatus = new SSE([serverState.cacheStatus.operate]);
  const serverSentDeviceStatus = new SSE([serverState.cacheStatus.device]);
  const serverSentHostStatus = new SSE([readHostStatus()]);


  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"ServerSentEvents", status:"ok", ready:true }
  });

  router.get("/api/operates/sse", (...args)=>{
    serverSentOperateStatus.init(...args);
  })

  serverState.event.on("shouldSentOperateStatusContent", (statusContent)=>{
    console.log("statusContent", statusContent)
    serverSentOperateStatus.updateInit(statusContent)
    serverSentOperateStatus.send(statusContent)
    sendHostStatus()
  })

  router.get("/api/devices/sse", (...args)=>{
    serverSentDeviceStatus.init(...args);
  })

  serverState.event.on("shouldSentDeviceStatusContent", (statusContent)=>{
    serverSentDeviceStatus.updateInit(statusContent)
    serverSentDeviceStatus.send(statusContent)
    sendHostStatus()
  })

  router.get("/api/host/sse", (...args)=>{
    serverSentHostStatus.init(...args);
  })

  function sendHostStatus (){
    const hostStatus = readHostStatus()
    serverSentHostStatus.updateInit(hostStatus)
    serverSentHostStatus.send(hostStatus)
  }

  serverState.event.emit("shouldBroadcastAllOperators");

  return router
}