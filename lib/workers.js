const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');
const helpers = require('./helpers');
const _data = require('./data');

workers = {};

workers.gatherAllChecks = () => {
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(checks => {
        _data.read('checks', checks, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error: Reading not of the check data");
          }
        });
      })
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
}

workers.validateCheckData = (originalCheckData) => {
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds % 1 == 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds <= 5 ? originalCheckData.timeOutSeconds : false;

  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  if (originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeOutSeconds) {
    workers.performCheck(originalCheckData);
  } else {
    console.log("Error: one of the checks is not properly formatted. Skipping.");
  }
}

workers.performCheck = (originalCheckData) => {
  let checkOutcome = {
    error: false,
    responseCode: false
  };

  let outcomeSent = false;

  const parseUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  const hostname = parseUrl.hostname;
  const path = parseUrl.path;

  const requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000
  };

  const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  const req = _moduleToUse.request(requestDetails, res => {
    const status = res.statusCode;

    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutocme(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('error', err => {
    checkOutcome.error = {
      error: true,
      value: err
    };

    if (!outcomeSent) {
      workers.processCheckOutocme(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', err => {
    checkOutcome.error = {
      error: true,
      value: 'timeout'
    };

    if (!outcomeSent) {
      workers.processCheckOutocme(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
}

workers.processCheckOutocme = (originalCheckData, checkOutcome) => {
  const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
  const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  _data.update('checks', newCheckData.id, newCheckData, function(err) {
    if (!err) {
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed, no alert needed");
      }
    } else {
      console.log("Error trying to save updates to one of the checks");
    }
  });
}

workers.alertUserToStatusChange = newCheckData => {
  const msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
  helpers.sendTwilloSms(newCheckData.userPhone, msg, function(err) {
    if (!err) {
      console.log("Success: User was alerted to a status change in their check, via sms: ", msg);
    } else {
      console.log("Error: Could not send sms alert to user who had a state change in their check", err);
    }
  });
};

workers.loop = () => {
  setInterval(function() {
    workers.gatherAllChecks();
  }, 1000 * 60);
}

workers.init = () => {
  workers.gatherAllChecks();
  workers.loop();
}

module.exports = workers;
