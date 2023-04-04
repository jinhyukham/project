const schedule = require("node-schedule");
const moment = require("moment");
const util = require("../utils/util");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const httpcall = require("../protocol/httpCall");
const getLog = require("../apis/getLog");
const directory = "../dw";
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}
// '0 3 * * *'
function LogSchedule() {
  const rule = new schedule.RecurrenceRule();
  rule.minute = 0;
  rule.hour = 3; // 오전 3시에 실행 밑에 테스트용 시간 바꿔야함
  const LogSchedule = schedule.scheduleJob("*/5 * * * * *", async function () {
    logger.info("===log schedule 시작===");
    let recvData;
    let options = {
      url: getLog.url,
      method: "GET",
      qs: { // LOG_SCHEDULE -> env.yml 파일에서 가져옴
        fromDate: util.getOldTime("d", LOG_SCHEDULE.logSubDate, "YYYY-MM-DD"),
        toDate: util.getOldTime("d", LOG_SCHEDULE.logSubDate, "YYYY-MM-DD"),
        _pageSize: LOG_SCHEDULE.pageSize,
        _page: 1,
        context: "stats,errState,device_type",
        _notrunc: true,
      },
      headers: getLog.head, // apis/getLog 파일에서 가져옴
      json: true,
    };

    try {
      recvData = await httpcall(options);

      if (_.isEmpty(recvData.result)) { // log 없을 시
        logger.info("=== Data is empty!! ===");
        return;
      } else if (recvData.result.length >= LOG_SCHEDULE.pageSize) { // paging처리
        recvData = await paging(options,recvData);
      }

      let recvLength = recvData.result.length;
      let result = dataFilter(recvData);
      writeFile(result); // 파일 생성
      deleteFile();// 30일 지난 파일 삭제
      logger.info(`=== log schedule ${recvLength}건 종료===`);

    } catch (err) {
      logger.error(`=== ERROR =>> ${err}`);
    }
    
  });
} // 스케쥴 종료

async function paging(options,recvData){
  while (true) {
    options.qs._page++; // pageCount up
    appendResult = (await httpcall(options)).result;
    recvData.result = _.concat(recvData.result, appendResult); // 기존 데이터에 새로운 데이터 append
    if (appendResult.length < LOG_SCHEDULE.pageSize) break; // 새 데이터 길이가 LOG_SCHEDULE.pageSize보다 작을때 break
  }
  return recvData
}

/** logsAPI에서 받아온 데이터 정제*/
function dataFilter(recvData) { 
  const filteredData = recvData.result.map((data) =>
    getLog.recv.reduce((saveData, { name, length, key }) => {
      let bf = _.get(data, name);
      if (!_.isEmpty(bf) && key) { // data 객체에서 name 속성의 값을 추출한 값이 있고 key 값이 있을 때
        saveData[key] = bf[0][key];
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

/** log 파일 생성 */
function writeFile(data) {
  let fileName = moment().format("YYYY-MM-DD") + ".txt"; // 파일명

    fs.writeFile(path.join(directory, fileName), data, { flag: "w" }, (err) => {
      if (err){ 
        logger.error("파일 생성중 오류 발생")
      }else{
        logger.info(`${directory}/${fileName} 파일 생성 성공`);
      } 
    });

}

/** 30일 지난 log 파일 삭제 */
function deleteFile(){
  const maxAge = moment.duration(LOG_SCHEDULE.deleteInterval, "days").asMilliseconds(); // 30일 지난 시간
  
  fs.readdir(directory, (err, files) => {
    if (err){
      logger.error("파일 삭제중 오류 발생")
      return;
    } 
    files.forEach((file) => {
        const filePath = path.join(directory, file);
        const age = Date.now() - fs.statSync(filePath).mtime.getTime(); // 파일의 수정 시간과 현재 시간의 차이를 계산
        if (age > maxAge) { // 파일의 수정시간이 maxAge보다 크면 파일을 삭제
          fs.unlinkSync(filePath);
          logger.info(`파일 삭제: ${filePath}`);
        }
      });
  });
}
module.exports = LogSchedule;
