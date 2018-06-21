/*
* Server Tasks
*/
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

const server = {};

//HTTP SERVER
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});


//HTTPS SERVER
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});



server.unifiedServer = (req, res) => {
  // Get the URL anpathrse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;

  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //Get the query string as an object
  const queryStringObject = parsedUrl.query;

  //Get the HTTP Method
  const method = req.method.toLowerCase();

  //Get the headers
  const headers = req.headers;

  //Get the payloads
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    //choose the handler this req should go to
    const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    //Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    //route the request to the handler specifed request
    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      payload = typeof(payload) == 'object' ? payload : {};

      //convert payload to string
      const payloadString = JSON.stringify(payload);

      //return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log(buffer);
    });
  });
};

//define a request router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};

server.init = () => {
  server.httpServer.listen(config.httpPort, ()=> {
    console.log(`Server on port ${config.httpPort}`);
  });

  server.httpsServer.listen(config.httpsPort, ()=> {
    console.log(`Server on port ${config.httpsPort}`);
  });
}

module.exports = server;
