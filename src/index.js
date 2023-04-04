// 사용하지 않는 프로토콜은 주석처리 하시오
const LogSchedule = require("./schedule/schedule");
const errorLogSchedule = require("./schedule/errorSchedule");

// 매일 오전 3시에 전일 로그 데이터 생성. ./logs/dw
LogSchedule();
// 매 1시간 마다 이전 1시간 메세지 로그의 _error 발생건수 체크
//errorLogSchedule();
