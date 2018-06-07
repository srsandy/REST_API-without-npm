/*
 Create and export conf variables

 openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
 */

// Container for all the enviournmnets
var enviournmnets = {};

enviournmnets.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging'
};

enviournmnets.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production'
};

//determine which one to export
var currentEnviournmnet = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var enviournmnetToExport = typeof(enviournmnets[currentEnviournmnet]) == 'object' ? enviournmnets[currentEnviournmnet] : enviournmnets.staging;

module.exports = enviournmnetToExport;
