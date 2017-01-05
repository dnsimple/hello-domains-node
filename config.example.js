'use strict';

var config = {}
config.session = {}

config.hostname       = '127.0.0.1';
config.port           = 3000;
config.clientId       = 'your-client-id';
config.clientSecret   = 'your-client-secret';
config.session.secret = 'somelongrandomstring';

module.exports = config;
