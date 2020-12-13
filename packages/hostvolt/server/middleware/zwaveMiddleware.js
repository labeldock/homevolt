const Router = require("express");
const ZWave = require('openzwave-shared');
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

  const zwave = new ZWave({
    ConsoleOutput: true
  });

  process.on('SIGINT', function () {
    console.log('disconnecting...');
    zwave.disconnect(connectPath);
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
  
  zwave.on('connected', function (version) {
    console.log("TRIGGER ---CONNECTED")
    serviceStatus.libVersion = version
    serverState.event.emit("shouldBroadcastAllOperators");
  });

  zwave.on('driver ready', function (homeid) {
    console.log("TRIGGER ---DRIVER_READY")
    serviceStatus.ready = false;
    serviceStatus.homeid = homeid
    console.log('scanning homeid=0x%s...', homeid.toString(16));
    serverState.event.emit("shouldBroadcastAllOperators");
  });
  
  zwave.on('driver failed', function () {
    console.log("TRIGGER ---DRIVER_FAILED")
    serviceStatus.failed = true;
    serverState.event.emit("shouldBroadcastAllOperators");
  });

  zwave.on('node added', function (nodeid) {
    console.log("TRIGGER ---NODE_ADDED")
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
  });

  zwave.on('node ready', function (nodeid, nodeinfo) {
    console.log("TRIGGER ---NODE_READY")
    console.log("nodeid", nodeid, nodeinfo);

    nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
    nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
    nodes[nodeid]['product'] = nodeinfo.product;
    nodes[nodeid]['producttype'] = nodeinfo.producttype;
    nodes[nodeid]['productid'] = nodeinfo.productid;
    nodes[nodeid]['type'] = nodeinfo.type;
    nodes[nodeid]['name'] = nodeinfo.name;
    nodes[nodeid]['loc'] = nodeinfo.loc;
    nodes[nodeid]['ready'] = true;
    console.log('node%d: %s, %s', nodeid,
      nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
      nodeinfo.product ? nodeinfo.product : 'product=' + nodeinfo.productid +
        ', type=' + nodeinfo.producttype);
    console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
      nodeinfo.name,
      nodeinfo.type,
      nodeinfo.loc);
    for (comclass in nodes[nodeid]['classes']) {
      switch (comclass) {
        case 0x25: // COMMAND_CLASS_SWITCH_BINARY
        case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
          zwave.enablePoll(nodeid, comclass);
          break;
      }
      var values = nodes[nodeid]['classes'][comclass];
      console.log('node%d: class %d', nodeid, comclass);
      for (idx in values)
        console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[
          idx]['value']);
    }
    console.log("LOG ---NODES_STATUS")
    console.log(nodes)
    serverState.event.emit("shouldBroadcastAllDevices");
  });

  zwave.connect(zwaveConnectPath);

  serverState.event.emit("shouldBroadcastAllOperators");
  
  return router
}

function zwaveFeature (){

}

