'use strict';

const config = require('./config');

const http = require('http');
const url = require('url');
const sessions = require('client-sessions');
const randomstring = require('randomstring');

const Dnsimple = require('dnsimple');

const app = require('connect')();
app.use(sessions({
  cookieName: 'session',
  secret: config.session.secret,
}));

// Handlers

const errorHandler = function(req, res, error) {
  console.log(error);
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
  let state = randomstring.generate(12);
  req.session.state = state;
  let client = Dnsimple({});

  res.statusCode = 200;
  res.setHeader('Content-type', 'text/html');
  res.end(`<a href="${client.oauth.authorizeUrl(config.clientId, {state: state})}">authorize</a>`);
}

const authorizedHandler = function(req, res) {
  let requestUrl = url.parse(req.url, true);

  if (requestUrl.query.error != null) {
    errorHandler(req, res, requestUrl.query.error_description);
    return
  }

  let state = req.session.state;
  let client = Dnsimple({});
  let code = requestUrl.query.code;

  client.oauth.exchangeAuthorizationForToken(code, config.clientId, config.clientSecret, {state: state}).then(function(response) {
    let accessToken = response.access_token;
    req.session.accessToken = accessToken;
    client = Dnsimple({accessToken: accessToken});
    return client.identity.whoami();
  }, function(error) {
    errorHandler(req, res, error);
  }).then(function(response) {
    let email = response.data.account.email;
    req.session.accountId = response.data.account.id;

    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.end(`<!DOCTYPE html><html><p>authorized as ${email}<p><a href="/domains">list domains</a></p></html>`);
  }, function(error) {
    errorHandler(req, res, error);
  });
}

const domainsHandler = function(req, res) {
  if (req.session && req.session.accessToken) {
    let client = Dnsimple({accessToken: req.session.accessToken});
    client.domains.allDomains(req.session.accountId).then((response) => {
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/plain');
      res.end(`Response:\n\n${JSON.stringify(response, null, '  ')}`);
    }, function(error) {
      errorHandler(req, res, error);
    });
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
