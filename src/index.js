const scheduleDw = require("./schedule/scheduleDw");
const scheduleAlert = require("./schedule/scheduleAlert");

// 매일 오전 3시에 전일 로그 데이터 생성. ./logs/dw
scheduleDw();
// 매 1시간 마다 이전 1시간 메세지 로그의 _error 발생건수 체크
scheduleAlert();
