const schedule = require("node-schedule");
const util = require("../utils/util");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const httpCall = require("../protocol/httpCall");
const getLog = require("../apis/getLog");
const moment = require('moment')
// log openapi 조회 수 : max:1만, default:100
const gOptions = {
  headers: {
    "api-key": COG_LOG.apiKey,
    "domain-id": COG_LOG.domainId,
  },
  json: true,
};
if (!fs.existsSync(DW_DIR)) {
  fs.mkdirSync(DW_DIR);
}
const rule = new schedule.RecurrenceRule();
rule.minute = 0;
rule.hour = 3; // 오전 3시에 실행 밑에 테스트용 시간 바꿔야함

/** 매일 오전 3시에 전일 로그 데이터 생성 */
function scheduleDw() {
  const scheduleDw = schedule.scheduleJob(rule, async function () { // "*/5 * * * * *" 테스트
    util.envReload();
    loggerDw.info("### start scheduleDw ###");
    const fdate = util.getOldTime("d", COG_LOG.subFromDate, "YYYY-MM-DD 00:00:00.000"); //시작시간 테스트용 시간 들어가있음. 반영때 필수로 변경 default:1 !!
    const tdate = util.getOldTime("d", COG_LOG.subToDate, "YYYY-MM-DD 23:59:59.999"); //종료시간

    try {
      const count = await getCount(fdate, tdate); // log pageCount 가져오기
      const page = Math.ceil(count / COG_LOG.pageSize);
      loggerDw.info("> count=%d   page=%d", count, page);
      await createFile(page);
    } catch (e) {
      loggerDw.error(e);
    }
    deleteFiles();
    loggerDw.info("### end scheduleDw ###");
  });
} // 스케쥴 종료

/** page count 가져오기 */
async function getCount(fdate, tdate) {
  let count = 0;
  let opt = {
    url: `${COG_LOG.baseUrl}/apis/projects/${COG_LOG.projectId}/log/-/count`,
    qs: {
      fromDate: fdate,
      toDate: tdate,
    },
    ...gOptions,
  };
  loggerDw.info("> fromDate : ", fdate);
  loggerDw.info("> toDate   : ", tdate);

  let items = await httpCall(opt);
  if (items.resultCode == 200) {
    count = items.result;
  } else {
    loggerDw.info(items.resultMessage);
  }
  return count;
}

/** 데이터 필터 및 파일생성 */
async function createFile(page) {
  const options = {
    url: `${COG_LOG.baseUrl}/apis/projects/${COG_LOG.projectId}/log`,
    method: "GET",
    qs: { // LOG_SCHEDULE -> env.yml 파일에서 가져옴
      fromDate: util.getOldTime("d", COG_LOG.subFromDate, "YYYY-MM-DD"),
      toDate: util.getOldTime("d", COG_LOG.subToDate, "YYYY-MM-DD"),
      _pageSize: COG_LOG.pageSize,
      context: "stats,errState,device_type",
      _notrunc: true,
    },
    ...gOptions,
  };

  const date = util.getOldTime("d", 0, "YYYYMMDD");
  const fd = fs.openSync(`${DW_DIR}/DW_SOE_${date}.dat`, "w");
  
  for (let i = 1; i <= page; i++) { // 페이징처리
    options.qs._page = i;
    const appendRes = await httpCall(options);
    if (appendRes.resultCode !==200) {
      loggerDw.error("> page=", page, appendRes.resultCode, appendRes.resultMessage);
      break;
    }
    const txt = i > 1 ? "\n" + dataFilter(appendRes) : dataFilter(appendRes);
    fs.appendFileSync(fd, util.utf8ToCp949(txt)); // 인코딩 및 data append
  }
  loggerDw.info(`> log file created ${DW_DIR}/DW_SOE_${date}.dat`)
  fs.closeSync(fd);
}

/** logsAPI에서 받아온 데이터 정제*/
async function dataFilter(recvData) {
  const filteredData = recvData.result.map((data) =>
    getLog.recv.reduce((saveData, { name, length, key }) => { // ../apis/getLog 참조
      let bf = _.get(data, name);
      if (!_.isEmpty(bf) && key) { // data 객체에서 name 속성의 값을 추출한 값이 있고 key 값이 있을 때
        saveData[key] = bf[0][key]; // key 값이 있을경우 배열에 첫번째 값만 가져옴.
      } else {
        bf = _.isObject(bf) ? JSON.stringify(bf) : bf && bf.toString(); // 문자열로 변환
        if (bf && Buffer.from(bf).length > length) {
          bf = Buffer.from(bf).slice(0, length).toString(); // 길이 제한. 정해진 크기 넘어가면 짜름
        }
        saveData[name] = bf;
      }
      return saveData;
    }, {})
  ); //map 끝

  return filteredData
    .map((obj) => Object.values(obj).join(Buffer.from("1f", "hex"))) // hex 코드 구분자 추가
    .join("\n");
}

/** 일정기간 지난 파일 삭제 */
function deleteFiles() {
  const date = new Date(util.getOldTime('d', COG_LOG.deleteDate)); // 삭제 기간 설정
  const files = fs.readdirSync(path.resolve(DW_DIR)).filter(file=>file.endsWith('.dat'));
  for (let file of files) {
    const st =  fs.statSync(DW_DIR + file);
    if (st.isFile() && date > new Date(st.mtime)) { // 파일 생성 시간이 삭제기간 넘었을때
      fs.unlink(path.resolve(DW_DIR,file), (err) => {
        if (err) loggerDw.error(err);
        else loggerDw.info("> delete file:", file, st.mtime);
      });
    }
  }
}
module.exports = scheduleDw;