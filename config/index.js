const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

let envyml = `${ROOT}/env.yml`;
let env = yaml.safeLoad(fs.readFileSync(envyml,'utf8'));

// DEV,TEST,PROD 에 맞는 global변수 설정
for(let key in env[ENV_CD]) {
	global[key] = env[ENV_CD][key];
}

// 로그 설정
require('../logs/logging');

global.SCHEMA = {};
let scfiles = fs.readdirSync(path.resolve(`${ROOT}/schema`));
// schema 파일을 읽어서 global변수에 저장
scfiles.forEach( file => {
	if( file.endsWith('.js')) {
		let id = file.replace('.js', '');
		try {
			global.SCHEMA[id] = require(`../schema/${file}`);
		}catch(err) {
			logger.error('Invalid schema file : %s', file);
		}
	}
});
