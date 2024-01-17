/**************************************
 * HTTP 처리계 연동
 **************************************/
const request = require("request");

async function httpCall(options) {
  let recvData = await new Promise((resolve, reject) => {
    if (options.method == "POST") {
      request.post(options, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }
        if (response.statusCode != 200) {
          reject(response.statusCode);
          return;
        }
        resolve(body);
      });
    } else {
      request.get(options, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }
        if (response.statusCode != 200) {
          reject(response.statusCode);
          return;
        }
        resolve(body);
      });
    }
  });
  return recvData;
}

module.exports = httpCall;
