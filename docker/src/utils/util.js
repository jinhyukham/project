const momentT = require("moment-timezone");
const iconv = require("iconv-lite");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const yaml = require("js-yaml");

function makeTimeString(dateTime, format) {
  if (dateTime && dateTime.length > 0) {
    dateTime = momentT(dateTime)
      .tz(TIME_ZONE)
      .format(format || "YYYYMMDDHHmmssSSS");
  } else {
    dateTime = momentT()
      .tz(TIME_ZONE)
      .format(format || "YYYYMMDDHHmmssSSS");
  }
  return dateTime;
}

function getOldTime(type, v, format) {
  let date = momentT().tz(TIME_ZONE);
  switch (type) {
    case "d":
      date = date.subtract(v, "days");
      break;
    case "h":
      date = date.subtract(v, "hours");
      break;
    case "m":
      date = date.subtract(v, "minutes");
      break;
    case "s":
      date = date.subtract(v, "seconds");
      break;
    default:
      date = date.subtract(v, "days");
      break;
  }
  return date.format(format || "YYYY-MM-DD");
}

// utf8문자열 추가
function appendStr(target, len, value) {
  let b = Buffer.alloc(len, 0x20);
  b.write(value);
  return target + b.toString();
}
// String(utf8) => Buffer(euc-kr)추가
function appendBuff(buffer, len, value, params) {
  let b = Buffer.alloc(len, 0x20);
  if (params.charset == "euc-kr") {
    // IF_SOCK.charset == 'euc-kr'
    let krBuf = utf8ToKr(value);
    krBuf.copy(b, 0, 0, krBuf.length);
  } else {
    b.write(value);
  }

  return Buffer.concat([buffer, b]);
}

function sliceBuff(buff, start, len, params) {
  let b = buff.slice(start, len + start);
  let str = "";
  if (params.charset == "euc-kr") {
    // IF_SOCK.charset == 'euc-kr'
    str = krToUtf8(b);
  } else {
    str = b.toString();
  }
  return str.trim();
}
// buffer(euc-kr) => String(utf8)🤣
function krToUtf8(buf) {
  let utf8Str = iconv.decode(buf, "euc-kr");
  return utf8Str;
}
// String(utf8) => buffer(euc-kr)
function utf8ToKr(str) {
  return iconv.encode(str, "euc-kr");
}
function utf8ToCp949(str) {
  return iconv.encode(str, "cp949");
}

function formatLength(items) {
  let length = 0;
  for (let item of items) {
    if (item.length) {
      length = length + parseInt(item.length);
    }
  }
  return length;
}

function setReturnCode(code, msg) {
  return {
    resultCode: code,
    resultMessage: msg,
  };
}

function createUUID() {
  return uuidv4();
}

/** DEV,TEST,PROD 에 맞는 global변수 리로드 */
function envReload() {
  let envyml = `${ROOT}/env.yml`;
  let env = yaml.safeLoad(fs.readFileSync(envyml, "utf8"));
  for (let key in env[ENV_CD]) {
    global[key] = env[ENV_CD][key];
  }
}

function nullchk(ele) {
  if (ele === null || ele === undefined) {
    return false;
  } else if (typeof ele === "string" || ele instanceof String ||typeof ele === "number") {
    return ele.toString().trim() === "" ? false : true;
  } else if (Array.isArray(ele)) {
    return ele.length > 0 ? true : false;
  } else if (typeof ele === "object") {
    return Object.keys(ele).length > 0 ? true : false;
  }

  return ele ? true : false;
}

module.exports = {
  nullchk,
  makeTimeString,
  getOldTime,
  appendStr,
  appendBuff,
  sliceBuff,
  krToUtf8,
  utf8ToKr,
  utf8ToCp949,
  formatLength,
  setReturnCode,
  createUUID,
  envReload,
};
