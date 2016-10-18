#!/usr/bin/env node

'use strict';
const app_info     = require('../package.json');
const debug        = require('debug')('Application');
const logger       = require('morgan');
const config       = require('nconf');
const gitrev       = require('git-rev');
const http         = require('http');
const express      = require('express');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const engine       = require('ejs-locals');
const favicon      = require('serve-favicon');

/**
* Retrieve the configuration
*   Order: CLI, Environment, config file, defaults.
*   Reminder: When running through foreman (nf), the port will be set to 5000 via the environment
*/
config.argv({
  port: { alias: 'p', describe: 'Make the server listen to this port' },
})
.env({ separator: '_', lowerCase: true })
.file({ file: './config.json' })
.defaults({
  port: 3000,
  purecloud: {
    region: 'mypurecloud.com',
    organization: { id: undefined },
    client: {
      id:     undefined,
      secret: undefined,
    },
  },
});

/**
* Create the application.
*/
var app = express();

/**
* Environment and git information
*/
console.log("Version: %s (%s)", app_info.version, app.get('env'));
debug("Debug is on");
gitrev.short(function(value)  { app.set('git_commit', value); console.log('Git commit: ' + value); });
gitrev.branch(function(value) { app.set('git_branch', value); console.log('Git branch: ' + value); });
gitrev.tag(function(value)    { app.set('git_tag', value);    console.log('Git tag: '    + value); });

/**
* Configure the application.
*/
app.set('port', config.get('port'));
app.set('views', 'views');
app.set('view engine', 'ejs');
app.engine('ejs', engine);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: '3EE7E60C-0F8D-41AC-BCE0-3D7E1751A78D',
  resave: false,
  saveUninitialized: false
}));
app.use(favicon('public/favicon.ico'));
app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));

/**
* Configure the routes.
*/

// Common tracing and locals
app.use(function(req, res, next) {
  debug("Worker %d - %s %s", cluster.worker.id, req.method, req.path);
  debug('Session id: ' + req.session.id);
  if (req.session.token) { debug('Session Token: ' + req.session.token); }
  if (req.session.user)  { debug('Session user:  ' + req.session.user.username); }
  req.purecloud = {
    environment:    config.get('purecloud:region'),
    organizationId: config.get('purecloud:organization:id'), 
    strategy:       'client-credentials',
    clientId:       config.get('purecloud:client:id'),
    clientSecret:   config.get('purecloud:client:secret'),
    token:          req.session.token,
    user:           req.session.user,
    timeout:        5,
  };
  res.locals.purecloud = {
    environment:    config.get('purecloud:region'),
    organizationId: config.get('purecloud:organization:id'), 
    token:          req.session.token,
    user:           req.session.user,
    timeout:        5,
  };
  res.locals.git = {
    commit: app.get('git_commit'),
    branch: app.get('git_branch')
  };
  res.locals.app_version = app_info.version;
  next();
});


// Application routes
app.use('/',      require('../routes/index'));

// Error routes
app.use(function(req, res, next) { // catch 404 and forward to error handler
  var err = new Error('Not Found');
  err.status = 404;
  console.warn('Error: %o', err);
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) { // development error handler (with stacktrace)
    res.status(err.status || 500);
    console.warn('Error: %o', err);
    res.render('error', { message: err.message, error: err });
  });
} else {
  app.use(function(err, req, res, next) { // production error handler (without stacktraces)
    res.status(err.status || 500);
    console.warn('Error: %o', err);
    res.render('error', { message: err.message, error: {} });
  });
}

/**
* Create Application server.
*/
app.listen(config.get('port'), function(){
  console.log("Listening on port %s", config.get('port'));
  });

// Expose app
exports = module.exports = app;
