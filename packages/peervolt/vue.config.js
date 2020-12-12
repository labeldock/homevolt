const middleware = require("./server/middleware");
const path = require("path");

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.resolve.alias.set("~", path.join(__dirname, "src"));
  },
  devServer: {
    host: "0.0.0.0",
    before: middleware
  }
};
