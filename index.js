/*
 * Primary file for the API
 */

//Dependencies
// var http = require('http');
// var url = require('url');
// var StingDecoder = require('string_decoder').StingDecoder;

// var server = http.createServer(function(req, res) {

//   // Get the URL and parse it
//   var parsedUrl = url.parse(req.url, true);

//   // Get the path
//   var path = parsedUrl.pathname;
//   var trimmedPath = path.replace(/^\/+|\/+$/g, '');

//   // Get the query string as an object
//   var queryStringObject = parsedUrl.query;

//   // Get the HTTP Method
//   var method = req.method.toLowerCase();

//   // Get the header as an object
//   var headers = req.headers;

//   // Get the payload, if any
//   var decoder = new StingDecoder('utf-8');
//   var buffer = '';
//   req.on('data', function(data) {
//     buffer += decoder.write(data);
//   });

//   req.on('end', function() {
//     buffer += decoder.end();

//     // Send the response
//     res.end('hii');

//     // Log the request path
//     console.log(buffer);
//   })



// });

// server.listen(3000, function() {
//   console.log('PORT 3000');
// });
