const bodyParser = require("body-parser");
const bridgeInterfaceMiddleware = require("./bridgeInterfaceMiddleware");
const connectorsMiddleware = require("./connectorsMiddleware");
const hostSentEventsMiddleware = require("./hostSentEventsMiddleware");
const zwaveMiddleware = require("./zwaveMiddleware");
const { generateUUID } = require("shared/functions");

module.exports = (app, serverState = {}) => {
  const API_PORT = 20100;
  const UDP_PORT = 20110;
  const UUID = generateUUID();

  Object.assign(serverState, {
    API_PORT,
    UDP_PORT,
    UUID
  });

  app.use(bodyParser.json());
  app.use(bridgeInterfaceMiddleware(serverState));
  app.use(connectorsMiddleware(serverState));
  app.use(hostSentEventsMiddleware(serverState));
  app.use(zwaveMiddleware(serverState));
};
