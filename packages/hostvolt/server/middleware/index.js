const bodyParser = require("body-parser");
const answerMiddleware = require("./offerMiddleware");
const { generateUUID } = require("shared/functions");

module.exports = (app, serverState = {}) => {
  const API_PORT = 20100;
  const UDP_PORT = 20110;
  const SOCKET_PORT = 20120;
  const UUID = generateUUID();

  Object.assign(serverState, {
    API_PORT,
    UDP_PORT,
    UUID
  });

  app.use(bodyParser.json());
  app.use(answerMiddleware(serverState));

};
