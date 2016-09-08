# HelloDomains

## DNSimple Oauth application

First, you need to create the OAuth application in your DNSimple account. Go to your Account page and click on the Applications tab. Once you are there, click on the Developer applications tab and add a New application. You will need to provide an application name (something like `Hello Domains Node` will work) as well as a homepage URL (any HTTPS URL will do). For the authorization callback, enter `http://localhost:4000/authorized`. Once you've created the OAuth application on the DNSimple site, you will see Client ID and Client Secret values on the next page. You will need to copy these two values into your local configuration as described below.

## Configuration

Copy `config.example.js` to `config.js` and set the clientId and clientSecret values so they match what is provided from the DNSimple OAuth application you added. The configuration file should look something like this:

```javascript
'use strict';

var config = {}

config.hostname       = '127.0.0.1';
config.port           = 3000;
config.clientId       = '123abc456edf789abc';
config.clientSecret   = '059ebc4839cd8a8d9430da9245dd0';
config.session.secret = 'somelongrandomstring';

module.exports = config;
```

## Start the Hello Domains app

* Install dependencies:
  - `npm install connect`
  - `npm install client-sessions`
* Create and migrate your database with `createdb hello_domains_dev && psql hello_domains_dev < schema.sql`

Noe that the application is configured, start it with `node server.js`

Now you can visit [`http://localhost:4000`](http://localhost:3000) from your browser.
