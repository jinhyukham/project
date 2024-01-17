const path = require("path");
const process = require("process");
const fs = require("fs");
const yaml = require("js-yaml");
const util = require('./src/utils/util');
global.ROOT = path.resolve(__dirname);
// 쿠버네티스 환경설정에서 설정함(SE 작업) env.yml파일과 동일하게 DEV,TEST,PROD
global.HOST_NM = process.env.HOST_NM || require("os").hostname();
global.ENV_CD = process.env.ENV_CD || "DEV";
util.envReload();

require("./config/logging");
logger.info('batch server open>>')
require("./src/index");

process.on("SIGABRT", function () {
  logger.info("===== SIGABRT =====");
  process.exit(0);
});
process.on("SIGTERM", function () {
  logger.info("===== SIGTERM =====");
  process.exit(0);
});

process.on("uncaughtException", function (err) {
  logger.error("====== uncaughtException ========");
  logger.error(err);
  process.exit(0);
});
