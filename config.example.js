'use strict';

var config = {}
config.session = {}

config.hostname       = 'localhost';
config.port           = 3000;
config.clientId       = 'your-client-id';
config.clientSecret   = 'your-client-secret';
config.session.secret = 'somelongrandomstring';

module.exports = config;
