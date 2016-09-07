'use strict';

const config = require('./config');

const http = require('http');
const url = require('url');

const Dnsimple = require('dnsimple');

var client = Dnsimple({});

const errorHandler = function(error) {
  res.statusCode = 400;
  res.setHeader('Content-type', 'text/plain');
  res.end(`error: ${error}`);
}

const server = http.createServer((req, res) => {
  let requestUrl = url.parse(req.url, true);
  console.log(requestUrl);
  let state = '123456780';
  switch (requestUrl.pathname) {
    case '/':
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      res.end(`<a href="${client.oauth.authorizeUrl(config.clientId, {state: state})}">authorize</a>`);
      break;
    case '/authorized':
      if (requestUrl.query.error != null) {
        res.statusCode = 400;
        res.setHeader('Content-type', 'text/plain');
        res.end(`error: ${requestUrl.query.error_description}`);
        return
      }

      client.oauth.exchangeAuthorizationForToken(requestUrl.query.code, config.clientId, config.clientSecret, {state: state}).then(function(response) {
        var accessToken = response.access_token;
        client = Dnsimple({accessToken: accessToken});
        return client.identity.whoami();
      }, errorHandler).then(function(response) {
        res.statusCode = 200;
        res.setHeader('Content-type', 'text/plain');
        res.end(`Response:\n\n${JSON.stringify(response, null, '  ')}`);
      }, errorHandler);

      break;
    default:
      res.statusCode = 404;
      res.setHeader('Content-type', 'text/plain');
      res.end('not found');
  }
});

server.listen(config.port, config.hostname, () => {
  console.log(`Server running at http://${config.hostname}:${config.port}/`);
});
