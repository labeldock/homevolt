const Router = require("express");

const dgram = require("dgram");
const eventHelper = require("shared/eventHelper");
const { parseMessagePayload } = require("shared/functions");
const { deferralReference } = require("shared/promise")
const udpServer = dgram.createSocket("udp4");

const udpEvent = eventHelper();
const hostCache = {};

const UDP_WAIT_TIME = 1000
const HOST_UDP_PORT = 20110

module.exports = serverState => {
  const router = Router();

  const { UDP_PORT } = serverState;

  udpServer.on("error", err => {
    console.log(`udpServer error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on("listening", () => {
    const address = udpServer.address();
    console.log(`udpServer listening ${address.address}:${address.port}`);
  });

  udpServer.on("message", (msg, rinfo) => {
    const { action, ...data } = parseMessagePayload(msg)
    console.log(`udpServer got: ${(msg+"").length}[${Object.keys(data)}] from ${rinfo.address}:${rinfo.port}`);

    if (action === "HOSTINFO") {
      udpEvent.emit("responsefindhost", {
        ...data,
        ...rinfo
      });
    }
  });

  udpServer.bind({ port: UDP_PORT, exclusive: false });

  serverState.hostCandidate = null;

  async function getHostListWithUDP (){
    return new Promise((resolve)=>{
      const responseBags = [];

      function handleFindHost(data) {
        responseBags.push(data);
      }
  
      udpEvent.on("responsefindhost", handleFindHost);
      udpServer.send(`{"action":"BROWSERTCHOST"}`, HOST_UDP_PORT);
  
      setTimeout(() => {
        responseBags.forEach((host)=>{
          const { uuid } = host;
          hostCache[uuid] = host;
        });
        udpEvent.off("responsefindhost", handleFindHost);
        resolve(responseBags);
      }, UDP_WAIT_TIME);
    })
  }

  router.get("/api/findhost", async (req, res) => {
    const responseBags = await getHostListWithUDP();
    res.status(200).send(JSON.stringify(responseBags));
  });

  router.get("/api/hostcache", async (req, res) => {
    res.status(200).send(hostCache);
  });

  router.post("/api/ticket/:uuid", async (req, res)=>{
    const { uuid } = req.params
    const { browserId } = req.body;

    if (!uuid || !browserId) {
      res.status(400);
      res.send("400 Bad Request");
      return;
    }
    
    const hostinfo = await (async ()=>{
      if(hostCache[uuid]){
        return hostCache[uuid]
      } else {
        await getHostListWithUDP();
        return hostCache[uuid]
      }
    })()

    if(!hostinfo){
      res.status(404).send("Host info not found")
      return
    }

    const { port, address } = hostinfo
    const sender = browserId;
    const server = uuid;
    const { promise:deferralUDPResponse } = deferralReference().use(({ onBeforeFullfill, resolve, reject })=>{  
      function handleReciveTicket (msg){
        const { action, ...data } = parseMessagePayload(msg)
        if(action === "PUBLISHEDTICKET"){
          resolve(data)
        }
      }
      udpServer.on("message", handleReciveTicket);
      
      onBeforeFullfill(()=>{
        udpServer.off("message", handleReciveTicket);
      })

      setTimeout(()=>{
        reject(new Error("UDP Timeout"))
      }, 12000)

      // udp send
      udpServer.send(JSON.stringify({
        action:"REQUESTTICKET",
        sender,
        server,
      }), port, address)
    })

    deferralUDPResponse
    .then((recive)=>{
      res.status(200).send(recive);
    })
    .catch((error)=>{
      if(error.message === "UDP Timeout"){
        res.status(408).send("Request timeout")
      } else {
        res.status(500).send(error)
      }
    })
  })

  router.post("/api/answer/:uuid", (req, res) => {
    const { uuid } = req.params
    const { ticket, answer, candidates, meta = {} } = req.body;

    if (!uuid || !ticket || !answer || !candidates) {
      res.status(400);
      res.send("400 Bad Request");
      return;
    }
    
    try {
      udpServer.send(JSON.stringify({ action:"ANSWER", server:uuid, ticket, answer, candidates, meta }), HOST_UDP_PORT)
      res.status(200);
      res.send({ status:"sended" });
    } catch(error){
      res.status(500);
      res.send(error.message);
    }
    
  });

  return router;
};
