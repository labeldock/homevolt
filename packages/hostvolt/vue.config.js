const middleware = require("./server/middleware");
const path = require("path");

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.resolve.alias.set("~", path.join(__dirname, "src"));
    config.resolve.alias.set("/shared", path.join(__dirname, "..", "shared"));
  },
  devServer: {
    port: 8090,
    before: middleware
  }
};
