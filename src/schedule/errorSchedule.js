const schedule = require("node-schedule");
const request = require("request");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const _ = require("lodash");
const httpcall = require("../protocol/httpCall");
const getLogCount = require("../apis/getLogCount");
const util = require('../utils/util')
function errorSchedule() {

  const rule = new schedule.RecurrenceRule();
  rule.minute = 5; // 정각마다 호출
  const errorSchedule = schedule.scheduleJob("*/5 * * * * *", async function () {
    envReload();
    logger.info("=== Error log schedule 시작===");
    const options = {
      url: getLogCount.url,
      method: "GET",
      qs: {
        fromDate: util.getOldTime("h", LOG_SCHEDULE.errorSubHour, "YYYY-MM-DD HH:00:00"),
        toDate: util.getOldTime("h", LOG_SCHEDULE.errorSubHour, "YYYY-MM-DD HH:59:59"),
      },
      headers: getLogCount.head,
      json:true
    };
    console.log("##",options.qs);
    try{
      let totalRecvData = await httpcall(options); //전체 건수 조회
      options.qs.error = "true";
      let errData = await httpcall(options); // 에러건수 조회
      let errPer = (errData.result / totalRecvData.result) * 100;// 퍼센트 계산
      if (errPer >= LOG_SCHEDULE.errorPer || true) {
        let pushResult = await pushAPIrequest();
        console.log(pushResult);
        logger.info(`result: ${JSON.stringify(pushResult)}`)
        logger.info(`#######에러 ${LOG_SCHEDULE.errorPer}% 넘음#######`);
        logger.info(`총건수:${totalRecvData.result}`);
        logger.info(`에러건수:${errData.result}`);
        logger.info(`퍼센트:${(errData.result / totalRecvData.result) * 100}`);
      }
    }catch(e){
      logger.info(`error!! ${e}`) 
    }

    logger.info("=== Error log schedule 종료===");
  });
}

async function pushAPIrequest(param){
  const data = {
    appNo:"40", // 40: 몰리메이트 required
    appId: "A000000001",// required 01:일반발송, 02:대체발송, 03:긴급발송 
    msgType : "01", // default:N, 예약전송인 경우 Y required
    reserveYn : "N", // 예약전송인 경우 Y option
    reserveDate : "", // 예약전송인 경우 필수 option YYYYMMDD
    reserveHour : "", // 예약전송인 경우 필수  ( 00 ~ 23 ) option HH
    reserveMin: "", // 예약전송인 경우 필수  ( 00 ~ 59 ) option mm
    senderPushYn : "N", // default:N, Y이면 발송자에게도 PUSH전송 option
    cnts: "전송할 내용 입력", // 전송할 내용 required
    registerId: "06123456", // 발송하는 사람 행번 필수 required
    systemCd: "30001", // 해당 외부시스템 systemCd 정의 후 코드 등록 필요 required
    androidSchema: "", // 설명 없음 option
    iosSchema: "", // 설명 없음 option
    webUrl:"", // 설명 없음 option
    userList: "12345678|87612312|", // 발송 대상 행번을 |로 연결, 맨 마지막 | 선택 required 
  };
  const options = {
    url: IF_PUSH.address,
    method: "POST",
    body:data,
    json:true
  };
  let sendResult = await httpcall(options);
  return sendResult
}

function envReload() {
  let envyml = `${ROOT}/env.yml`;
  let env = yaml.safeLoad(fs.readFileSync(envyml, "utf8"));
  // DEV,TEST,PROD 에 맞는 global변수 리로드
  for (let key in env[ENV_CD]) {
    global[key] = env[ENV_CD][key];
  }
}
module.exports = errorSchedule;
