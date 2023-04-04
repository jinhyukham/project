const crypto = require('crypto');

const aes = {
	key : '12345678901234561234567890123456',
	iv  : '1234567890123456'
}
const AES = global.AES || aes;
const KEY = Buffer.from( AES.key );
const IV  = Buffer.from( AES.iv  );

function encrypt(input,encode) {
	console.log(input,encode);
	let cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
	let encrypted = cipher.update(input, encode, 'base64');
	console.log(encrypted);
	encrypted = encrypted + cipher.final('base64');

	return encrypted;
}

function decrypt(input,encode) {
	let decipher = crypto.createDecipheriv('aes-256-cbc' , KEY, IV);
	let decrypted = decipher.update(input, 'base64', encode);
	
	if( encode) {
		decrypted = decrypted + decipher.final(encode);
	}else {
		decrypted = Buffer.concat([decrypted , decipher.final()]);
	}
	
	return decrypted;
}

module.exports = {
	encrypt,
	decrypt
}
