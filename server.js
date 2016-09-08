'use strict';

const config = require('./config');

const http = require('http');
const url = require('url');

const Dnsimple = require('dnsimple');

const sessions = require('client-sessions');

const app = require('connect')();
app.use(sessions({
  cookieName: 'session',
  secret: config.session.secret,
}));

// Handlers

const errorHandler = function(error) {
  res.statusCode = 400;
  res.setHeader('Content-type', 'text/plain');
  res.end(`error: ${error}`);
}

const notFoundHandler = function(req, res) {
  res.statusCode = 404;
  res.setHeader('Content-type', 'text/plain');
  res.end('not found');
}

const rootHandler = function(req, res) {
  let state = '123456780';
  let client = Dnsimple({});

  res.statusCode = 200;
  res.setHeader('Content-type', 'text/html');
  res.end(`<a href="${client.oauth.authorizeUrl(config.clientId, {state: state})}">authorize</a>`);
}

const authorizedHandler = function(req, res) {
  let state = '123456780';
  let requestUrl = url.parse(req.url, true);

  if (requestUrl.query.error != null) {
    errorHandler(requestUrl.query.error_description);
    return
  }

  let client = Dnsimple({});
  client.oauth.exchangeAuthorizationForToken(requestUrl.query.code, config.clientId, config.clientSecret, {state: state}).then(function(response) {
    let accessToken = response.access_token;
    req.session.accessToken = accessToken;
    client = Dnsimple({accessToken: accessToken});
    return client.identity.whoami();
  }, errorHandler).then(function(response) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plain');
    res.end(`Response:\n\n${JSON.stringify(response, null, '  ')}`);
  }, errorHandler);
}

const domainsHandler = function(req, res) {
  if (req.session && req.session.accessToken) {
    let client = Dnsimple({accessToken: req.session.accessToken});
    client.domains.allDomains(1).then((response) => {
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/plain');
      res.end(`Response:\n\n${JSON.stringify(response, null, '  ')}`);
    }, errorHandler);
  } else {
    res.writeHead(302, {
      'Location': '/'
    });
    res.end();
  }
}

const routes = {
  '/': rootHandler,
  '/authorized': authorizedHandler,
  '/domains': domainsHandler,
}

app.use((req, res) => {
  let requestUrl = url.parse(req.url, true);
  let handler = routes[requestUrl.pathname];
  if (handler == null) {
    notFoundHandler(req, res);
  } else {
    handler(req, res);
  }
});

const server = http.createServer(app);

server.listen(config.port, config.hostname, () => {
  console.log(`Server running at http://${config.hostname}:${config.port}/`);
});
