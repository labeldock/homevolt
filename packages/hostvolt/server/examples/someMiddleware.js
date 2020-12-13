const Router = require("express");

module.exports = serverState => {
  const router = Router();
  const status = {
    timeout:false
  };

  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"ExampleService", status:"ok", ready:true }
  });

  serverState.event.on("shouldPullDevicesStatus", ()=>{
    return {
      name:"exampleServiceTimeouted",
      value:status.timeout
    }
  })

  function main (){
    serverState.event.emit("shouldBroadcastAllDevices");
    setTimeout(()=>{
      status.timeout = true;
      serverState.event.emit("shouldBroadcastAllDevices");
    },10000)
  }

  main();

  serverState.event.emit("shouldBroadcastAllOperators");

  return router
}