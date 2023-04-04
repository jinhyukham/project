const util = require("../utils/util");

const url = `${LOG_SCHEDULE.cogUrl + LOG_SCHEDULE.projectId}/log/-/count`;
const head = {
  "coginsight-api-key": LOG_SCHEDULE.apiKey,
  "coginsight-domain-id": LOG_SCHEDULE.domainId,
};

// const send = {
//   fromDate: util.getOldTime("h", LOG_SCHEDULE.errorSubHour, "YYYY-MM-DD HH:00:00"),
//   toDate: util.getOldTime("h", LOG_SCHEDULE.errorSubHour, "YYYY-MM-DD HH:59:59"),
// };
// const recv = [
//   { name: "resultCode" },
//   { name: "result" },
//   { name: "resultMessage" },
// ];

module.exports = {
  url,
  head,
  //send,
};
