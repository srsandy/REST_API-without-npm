const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');
const config = require('./config');

var helpers = {};

helpers.hash = function(str) {
  if(typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
}

helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

  if(strLength) {
    const possibleCharacters = 'abcdefghijklmnopqrstvuwxyz0123456789';

    let str = '';
    for(let i=1; i<=strLength; i++) {
      const randomCharacters = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacters;
    }
    return str;
  } else {
    return false;
  }
}

helpers.sendTwilloSms = function(phone, msg, callback) {
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=1600 ? msg.trim() : false;

  if(phone && msg) {
    const payload = {
      'From': config.twillo.fromPhone,
      'To': '+91'+phone,
      'Body': msg
    };

    const stringPayload = querystring.stringify(payload);

    const requestDetails =  {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: '/2010-04-01/Accounts/'+config.twillo.accountSid+'/Messages.json',
      auth: config.twillo.accountSid+':'+config.twillo.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    const req = https.request(requestDetails, res => {
      const status = res.statusCode;
      if(status == 200 || status == 201) {
        callback(false);
      }else {
        callback('Status code was send '+status);
      }
    });

    req.on('error', e => {
      callback(e);
    });

    req.write(stringPayload);

    req.end();

  }else {
    callback('Givem prams are missing or invalid');
  }
}

module.exports = helpers;


