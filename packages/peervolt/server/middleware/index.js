const bodyParser = require("body-parser");
const questionMiddleware = require("./questionMiddleware");

module.exports = (app, serverState = {}) => {
  const API_PORT = 20200;
  const UDP_PORT = 20210;

  Object.assign(serverState, {
    API_PORT,
    UDP_PORT
  });

  app.use(bodyParser.json());
  app.use(questionMiddleware(serverState));
};
