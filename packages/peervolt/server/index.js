const express = require("express");
const middleware = require("./middleware");

const application = express();
const serverState = {};

middleware(application, serverState);

const API_PORT = serverState.API_PORT || 20100;

require("http")
  .Server(application)
  .listen(API_PORT, () => {
    console.log(`Server is listening on http://localhost:${API_PORT}`);
  });
