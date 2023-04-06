const fs = require("fs");
const httpCall = require("../protocol/httpCall");
const yaml = require("js-yaml");
const util = require("../utils/util");
const schedule = require("node-schedule");
const rule = new schedule.RecurrenceRule();
rule.minute = 5; // 매시 5분마다 호출 아래 테스트용 시간 변경해줘야함
const gOptions = {
  headers: {
    "coginsight-api-key": COG_LOG.apiKey,
    "coginsight-domain-id": COG_LOG.domainId,
  },
  json: true,
};

function scheduleAlert(){
  const scheduleAlert = schedule.scheduleJob("*/6 * * * * *", async function () {
    /* log파일 읽어온 후 특정 비율 이상 에러 발생 확인 */
    logger.info("######### scheduleAlert start ##########");
    try {
      await envReset(); // 스케쥴러 동작마다 env파일의 AGENT값 재세팅함
      let countFromDate = util.getOldTime("h", 3000, "YYYY-MM-DD HH:mm:ss"); // 테스트용 시간 변경해줘야함
      let countToDate = util.getOldTime("", 0, "YYYY-MM-DD HH:mm:ss"); 
      let options = {
        url: `${COG_LOG.baseUrl}/apis/projects/${COG_LOG.projectId}/log/-/count`,
        json: true,
        qs: {
          fromDate: countFromDate,
          toDate: countToDate,
        },
        ...gOptions
      };
      let logCount = await httpCall(options);
      options.qs.error = true;
      let errCount = await httpCall(options);
      logger.info("123",errCount)
      if (logCount.resultCode == 200 && errCount.resultCode == 200) {
        if (
          util.nullchk(errCount) &&
          (errCount.result / logCount.result) * 100 > COG_LOG.percent
        ) {
          await clientCall();
        } else {
          logger.info("######### scheduleAlert No Error! #########");
        }
      } else {
        logger.error("######### scheduleAlert Fail! #########");
      }
    } catch (e) {
      logger.error("######### scheduleAlert Error! #########", e);
    }
    logger.info("######### scheduleAlert End ##########");
  });
}



/**  서버 재기동 없이 스케쥴러 호출 시 env파일의 AGENT_SET 값을 변경값으로 재구성시킴 */
async function envReset() {
  let envyml = `${ROOT}/env.yml`;
  let env = yaml.safeLoad(fs.readFileSync(envyml, "utf8"));
  for (let key in env[ENV_CD]) {
    if (key == "AGENT_SET") {
      global[key] = env[ENV_CD][key];
    }
  }
}

/** 에러 발생 특정 이상 발생 시 call api */
async function clientCall() {
  logger.info("######### push API Start #########");
  try {
    // 실제 반영 시  url 변경 및 headers 고객사 api 헤더값으로 변경 필요함
    let bData = {
      appNo: "40", // 40: 몰리메이트 required
      appId: "A000000001", // required 01:일반발송, 02:대체발송, 03:긴급발송
      msgType: "01", // default:N, 예약전송인 경우 Y required
      reserveYn: "N", // 예약전송인 경우 Y option
      reserveDate: "", // 예약전송인 경우 필수 option YYYYMMDD
      reserveHour: "", // 예약전송인 경우 필수  ( 00 ~ 23 ) option HH
      reserveMin: "", // 예약전송인 경우 필수  ( 00 ~ 59 ) option mm
      senderPushYn: "N", // default:N, Y이면 발송자에게도 PUSH전송 option
      cnts: "전송할 내용 입력", // 전송할 내용 required
      registerId: "06123456", // 발송하는 사람 행번 필수 required
      systemCd: "30001", // 해당 외부시스템 systemCd 정의 후 코드 등록 필요 required
      androidSchema: "", // 설명 없음 option
      iosSchema: "", // 설명 없음 option
      webUrl: "", // 설명 없음 option
      userList: "12345678|87612312|", // 발송 대상 행번을 |로 연결, 맨 마지막 | 선택 required
    };
    let options = {
      url: `${COG_LOG.baseUrl}/apis/esd/${COG_LOG.schema}/records`, //AGENT_SET.devUrl, 여기 반영할때 수정 필요함.
      method: "POST",
      json: true,
      body: bData,
      ...gOptions
    };
    //console.log(options);
    if (options.body.reserveYn == "Y") {
      //예약전송이 Y일때 아래 항목들 필수
      options.body.reserveDate = ""; //예약년월일
      options.body.reserveHour = ""; //예약시간(시작시간)
      options.body.reserveMin = ""; //예약분(시작분)
    }

    let call = await httpCall(options);

    if (call?.error_code == 0) {
      logger.info("######### push API call! #########");
    } else {
      logger.info("######### push API Fail! #########");
    }
  } catch (e) {
    logger.info("######### push API Error #########");
  }
  logger.info("######### push API End #########");
}

module.exports = scheduleAlert;
