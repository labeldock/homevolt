const Router = require("express");
const OpenZWave = require('openzwave-shared');
const zwavePlatform = require('os').platform()
const zwaveDriverPaths = {
  "darwin": '/dev/cu.usbmodem1411',
  "win32": '\\\\.\\COM3',
}
const zwaveConnectPath = zwaveDriverPaths[zwavePlatform]

module.exports = serverState => {
  const router = Router();

  const serviceStatus = {
    ready:false,
    failed:false,
    libVersion:null,
    homeid:null
  };

  const nodes = []

  const zwave = new OpenZWave({
    Logging: false,
    ConsoleOutput: false
  });

  process.on('SIGINT', function () {
    console.log('disconnecting...');
    zwave.disconnect(zwaveConnectPath);
    process.exit();
  });
  
  serverState.event.on("shouldPullOperateStatus",async ()=>{
    return {type:"ZWave", ...serviceStatus }
  });

  serverState.event.on("shouldPullDevicesStatus", ()=>{
    return {
      name:"zwave nodes",
      value:nodes
    }
  })
  
  // load lib & hardware
  zwave.on('connected', function (version) {
    serviceStatus.libVersion = version
    serverState.event.emit("shouldBroadcastAllOperators");
  });

  zwave.on('driver ready', function (homeid) {
    serviceStatus.ready = true;
    serviceStatus.homeid = homeid
    serverState.event.emit("shouldBroadcastAllOperators");
  });
  
  zwave.on('driver failed', function () {
    serviceStatus.ready = false;
    serviceStatus.failed = true;
    serverState.event.emit("shouldBroadcastAllOperators");
  });


  //
  zwave.on('node added', function (nodeid) {
    nodes[nodeid] = {
      manufacturer: '',
      manufacturerid: '',
      product: '',
      producttype: '',
      productid: '',
      type: '',
      name: '',
      loc: '',
      classes: {},
      ready: false,
    };
    serverState.event.emit("shouldBroadcastAllDevices");
  });

  zwave.on('value added', function (nodeid, comclass, value) {
    if (!nodes[nodeid]['classes'][comclass])
      nodes[nodeid]['classes'][comclass] = {};
    nodes[nodeid]['classes'][comclass][value.index] = value;
  });

  zwave.on('node ready', function (nodeid, nodeinfo) {

    const zNode = nodes[nodeid]
    zNode['manufacturer'] = nodeinfo.manufacturer;
    zNode['manufacturerid'] = nodeinfo.manufacturerid;
    zNode['product'] = nodeinfo.product;
    zNode['producttype'] = nodeinfo.producttype;
    zNode['productid'] = nodeinfo.productid;
    zNode['type'] = nodeinfo.type;
    zNode['name'] = nodeinfo.name;
    zNode['loc'] = nodeinfo.loc;
    zNode['ready'] = true;
    
    for (comclass in zNode['classes']) {
      switch (comclass) {
        case 0x25: // COMMAND_CLASS_SWITCH_BINARY
        case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
          zwave.enablePoll(nodeid, comclass);
          break;
      }
      var values = zNode['classes'][comclass];
    }
    serverState.event.emit("shouldBroadcastAllDevices");
  });

  zwave.connect(zwaveConnectPath);

  serverState.event.emit("shouldBroadcastAllOperators");
  
  return router
}

