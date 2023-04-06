const fs = require("fs");
const httpCall = require("../protocol/httpCall");
const yaml = require("js-yaml");
const util = require("../utils/util");
const schedule = require("node-schedule");
const rule = new schedule.RecurrenceRule();
rule.minute = 5; // 매시 5분마다 호출 아래 테스트용 시간 변경해줘야함

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

function scheduleAlert(){
  const scheduleAlert = schedule.scheduleJob("*/6 * * * * *", async function () {
    /* log파일 읽어온 후 특정 비율 이상 에러 발생 확인 */
    loggerAlert.info("######### scheduleAlert start ##########");
    try {
      await envReset(); // 스케쥴러 동작마다 env파일의 AGENT값 재세팅함
      let countFromDate = util.getOldTime("h", 1, "YYYY-MM-DD HH:00:00"); // 테스트용 시간 변경해줘야함
      let countToDate = util.getOldTime("", 0, "YYYY-MM-DD HH:00:00"); 

      let options = {
        url: `${COG_LOG.baseUrl}/apis/projects/${COG_LOG.projectId}/log/-/count/`,
        json: true,
        qs: {
          fromDate: countFromDate,
          toDate  : countToDate,
        },
        headers: {
          "coginsight-api-key"  : COG_LOG.apiKey,
          "coginsight-domain-id": COG_LOG.domainId,
        }
      };
      let logCount = await httpCall(options);
      options.qs.error = true;
      let errCount = await httpCall(options);

      if (logCount.resultCode == 200 && errCount.resultCode == 200) {
        if (util.nullchk(errCount) && (errCount.result / logCount.result) * 100 > AGENT_SET.percent) {
          await clientCall();
        } else {
          loggerAlert.info("######### scheduleAlert No Error! #########");
        }
      } else {
        loggerAlert.error("######### scheduleAlert Fail! #########");
      }
    } catch (e) {
      loggerAlert.error("######### scheduleAlert Error! #########", e);
    }
    loggerAlert.info("######### scheduleAlert End ##########");
  });
}


/** 에러 발생 특정 이상 발생 시 call api */
async function clientCall() {
  loggerAlert.info("######### push API Start #########");
  try {
    // 실제 반영 시  url 변경 및 headers 고객사 api 헤더값으로 변경 필요함
    
    let options = {
      url: `${COG_LOG.baseUrl}/apis/esd/${COG_LOG.schema}/records`,//AGENT_SET.devUrl,
      headers: {
        "coginsight-api-key": COG_LOG.apiKey,
        "coginsight-domain-id": COG_LOG.domainId, 
      },
      method: 'POST',
      json: true,
      body: {
        appNo: AGENT_SET.appNo, //어플리케이션 번호
        appId: AGENT_SET.appId, //앱 ID
        msgType: "03", // 메시지유형
        reserveYn: AGENT_SET.reserveYn, //예약전송유무
        cnts: AGENT_SET.cnts, //내용
        registerId: AGENT_SET.registerId, //송신자행번
        systemCd: AGENT_SET.systemCd, //시스템코드
        userList: AGENT_SET.userList //발송대상리스트
      }
    };

    if (options.body.reserveYn == 'Y') { //예약전송이 Y일때 아래 항목들 필수
      options.body.reserveDate = ''; //예약년월일
      options.body.reserveHour = ''; //예약시간(시작시간)
      options.body.reserveMin  = ''; //예약분(시작분) 
    }

    let call = await httpCall(options);
    if (call?.error_code == 0) { 
      loggerAlert.info('######### push API call! #########');
    } else {
      loggerAlert.info('######### push API Fail! #########');
    }
  } catch (e) {
    loggerAlert.info("######### push API Error #########");
  }
  loggerAlert.info("######### push API End #########");
}

module.exports = scheduleAlert;
