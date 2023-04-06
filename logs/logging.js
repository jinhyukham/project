const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;
require("winston-daily-rotate-file");
const { LEVEL, MESSAGE, SPLAT } = require("triple-beam");
const moment = require("moment");
const util = require("util");
const uidSafe = require("uid-safe");
var sid = uidSafe.sync(10);
const _ = require("lodash");

LOG_LEVEL = global.LOG_LEVEL || "info";
LOG_DIR = global.LOG_DIR || "./logs";
LOG_MAXSIZE = global.LOG_MAXSIZE || "100m";
LOG_MAXFILES = global.LOG_MAXFILES || "30d";

let isError = function (e) {
  return (
    e &&
    e.stack &&
    e.message &&
    typeof e.stack === "string" &&
    typeof e.message === "string"
  );
};

const outConsole = printf((info) => {
  // console.log(info)
  let message, timestamp;
  if (info.message && typeof info.message == "object") {
    message = util.format.apply(null, info[SPLAT] || []);
    timestamp = info.message.timestamp || info.timestamp;
  } else {
    message = util.format.apply(null, [info.message].concat(info[SPLAT] || []));
    timestamp = info.timestamp;
  }
  let level = info.level.toUpperCase();

  return `${timestamp} [${level}] ${message}`; // log 출력 포맷 정의
});

const outFile = printf((info) => {
  let message, timestamp, access, tid;
  if (info.message && typeof info.message == "object") {
    message = util.format.apply(null, info[SPLAT] || []);
    timestamp = info.message.timestamp || info.timestamp;
    access = info.message.access;
    tid = info.message.tid;
  } else {
    message = util.format.apply(null, [info.message].concat(info[SPLAT] || []));
    timestamp = info.timestamp;
  }
  let level = info.level.toUpperCase();

  //return JSON.stringify({access,timestamp,level, message,app:APP_NAME,tid}) //`${timestamp} [${level.toUpperCase()}] ${message}`;    // log 출력 포맷 정의
  return `${timestamp} [${level}] ${message}`; // log 출력 포맷 정의
});

const fileOpitons = (level, filename, format) => ({
  level: level,
  dirname: LOG_DIR,
  filename: filename + ".%DATE%",
  // extension:'.log',
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: LOG_MAXSIZE,
  maxFiles: LOG_MAXFILES,
  localTime: true,
  createSymlink: true,
  symlinkName: filename,
  format: format,
  auditFile: (LOG_DIR || "../logs") + "/." + filename + ".audit.json",
});

global.logger = new createLogger({ // 이거 카피해서 새로 만들어요
  format: format((info) => {
    info.timestamp = moment().utcOffset(540).format("YYYY-MM-DD HH:mm:ss.SSS");
    return info;
  })(),
  transports: [
    new transports.Console({ level: LOG_LEVEL, format: outConsole }),
    new transports.DailyRotateFile(
      fileOpitons(LOG_LEVEL, `${APP_NAME}.out`, outFile) // 요게 파일명인데  이름 수정해야해~
    ),
  ],
  exitOnError: false,
});

global.loggerDw = new createLogger({ // 이거 카피해서 새로 만들어요
  format: format((info) => {
    info.timestamp = moment().utcOffset(540).format("YYYY-MM-DD HH:mm:ss.SSS");
    return info;
  })(),
  transports: [
    new transports.Console({ level: LOG_LEVEL, format: outConsole }),
    new transports.DailyRotateFile(
      fileOpitons(LOG_LEVEL, `${APP_NAME}_dw.out`, outFile) // 요게 파일명인데  이름 수정해야해~
    ),
  ],
  exitOnError: false,
});

global.loggerAlert = new createLogger({ // 이거 카피해서 새로 만들어요
  format: format((info) => {
    info.timestamp = moment().utcOffset(540).format("YYYY-MM-DD HH:mm:ss.SSS");
    return info;
  })(),
  transports: [
    new transports.Console({ level: LOG_LEVEL, format: outConsole }),
    new transports.DailyRotateFile(
      fileOpitons(LOG_LEVEL, `${APP_NAME}_alert.out`, outFile) // 요게 파일명인데  이름 수정해야해~
    ),
  ],
  exitOnError: false,
});

let _error = global.logger.error;
global.logger.error = function (...args) {
  if (args.length == 0) return;
  args = args.map((e) => {
    if (isError(e)) {
      return e.stack;
    } else {
      return e;
    }
  });

  _error.apply(global.logger, args);
};

let _errorDw = global.loggerDw.error;
global.loggerDw.error = function (...args) {
  if (args.length == 0) return;
  args = args.map((e) => {
    if (isError(e)) {
      return e.stack;
    } else {
      return e;
    }
  });

  _errorDw.apply(global.loggerDw, args);
};

let _errorAlert = global.loggerAlert.error;
global.loggerAlert.error = function (...args) {
  if (args.length == 0) return;
  args = args.map((e) => {
    if (isError(e)) {
      return e.stack;
    } else {
      return e;
    }
  });
  _errorAlert.apply(global.loggerAlert, args);
};