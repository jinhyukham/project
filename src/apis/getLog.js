
const url = `${LOG_SCHEDULE.cogUrl}${LOG_SCHEDULE.projectId}/log`;
const head = {
  "coginsight-api-key": LOG_SCHEDULE.apiKey,
  "coginsight-domain-id": LOG_SCHEDULE.domainId,
};

const recv = [
  { name: "name", length: 50 },
  { name: "sessionId", length: 50 },
  { name: "input", length: 4000 },
  { name: "output", length: 4000 },
  { name: "context.errState.errFlag", length: 10 },
  { name: "context.errState.errType", length: 10 },
  { name: "context.device_type", length: 20 },
  { name: "context.stats.firstLoginYn", length: 2 },
  { name: "context.stats.comebackLoginYn", length: 2 },
  { name: "context.stats.comebackLogin01Yn", length: 2 },
  { name: "context.stats.comebackLogin07Yn", length: 2 },
  { name: "context.stats.comebackLogin30Yn", length: 2 },
  { name: "context.stats.comebackLogin90Yn", length: 2 },
  { name: "context.stats.comebackLogin00Yn", length: 2 },
  { name: "context.stats.createdDate", length: 50 },
  { name: "context.stats.accessDate", length: 50 },
  { name: "context.stats.comebackDate", length: 50 },
  { name: "context.stats.weekOfMonth", length: 2 },
  { name: "context.stats.gender", length: 1 },
  { name: "context.stats.userAgeGroup", length: 10 },
  { name: "context.stats.sendTaskCompleteYn", length: 2 },
  { name: "context.stats.loanTaskCompleteYn", length: 2 },
  { name: "context.stats.EasyOutTaskCompleteYn", length: 2 },
  { name: "context.stats.listTaskCompleteYn", length: 2 },
  { name: "context.stats.exchgTaskCompleteYn", length: 2 },
  { name: "context.stats.sendTaskExitYn", length: 2 },
  { name: "context.stats.loanTaskExitYn", length: 2 },
  { name: "context.stats.EasyOutTaskExitYn", length: 2 },
  { name: "context.stats.listTaskExitYn", length: 2 },
  { name: "context.stats.exchgTaskExitYn", length: 2 },
  { name: "context.stats.sendTaskDeepLinkYn", length: 2 },
  { name: "context.stats.EasyOutTaskDeepLinkYn", length: 2 },
  { name: "context.stats.taskGroup", length: 100 },
  { name: "context.stats.taskNm", length: 100 },
  { name: "context.stats.taskStep", length: 100 },
  { name: "context.stats.nestedTask", length: 100 },
  { name: "context.stats.mainIntentYn", length: 2 },
  { name: "intents", length: 100 ,key:"intent"},
  { name: "intents", length: 10 ,key:"confidence"},
  { name: "entities", length: 4000 },
  { name: "context.stats.intentLowConfidence", length: 10 },
  { name: "context.stats.anythingElseYn", length: 2 },
  { name: "context.stats.actionType", length: 30 },
];
module.exports = {
  url,
  head,
  recv,
};
