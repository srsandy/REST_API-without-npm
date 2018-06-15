/*
 Create and export conf variables

 openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
 */

// Container for all the enviournmnets
var enviournmnets = {};

enviournmnets.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'aPrivateStringForStaging',
  maxChecks: 5,
  twillo: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  }
};

enviournmnets.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'aPrivateStringForProduction',
  maxChecks: 5,
  twillo: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  }
};

//determine which one to export
var currentEnviournmnet = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var enviournmnetToExport = typeof(enviournmnets[currentEnviournmnet]) == 'object' ? enviournmnets[currentEnviournmnet] : enviournmnets.staging;

module.exports = enviournmnetToExport;
