#!/usr/bin/env node

'use strict';
const app_info     = require('../package.json');
const debug        = require('debug')('Application');
const logger       = require('morgan');
const config       = require('nconf');
const gitrev       = require('git-rev');
const cluster      = require('cluster');

/**
* Retrieve the configuration
*   Order: CLI, Environment, config file, defaults.
*   Reminder: When running through foreman (nf), the port will be set to 5000 via the environment
*/
config.argv({
  port:    { alias: 'p', describe: 'Make the server listen to this port' },
  workers: { alias: 'w', describe: 'Tell how many workers should run in the cluster' },
})
.env({ separator: '_', lowerCase: true })
.file({ file: './config.json' })
.defaults({
  port: 3000,
  workers: 'auto',
  purecloud: {
    organizations: [
      {
        id:          undefined,
        region:      'mypurecloud.com',
        application: {
          strategy:  'client-credentials',
          id:        undefined,
          secret:    undefined,
        },
        timeout:     5,
      }
    ],
  },
});

/**
* Start the cluster
*/
if (cluster.isMaster) {
  var cpu_count    = require('os').cpus().length;
  // Count the machine's CPUs
  var worker_count = config.get('workers');

  console.log('Running on the cluster master process');

  if (worker_count === 'auto') {
    worker_count = cpu_count / 2;
  } else {
    worker_count = parseInt(worker_count, 10);
    if (worker_count <= 0) { worker_count = 1; }
  }

  console.log('This machine has %d CPUs, spawning %d workers', cpu_count, worker_count);
  for (var i=1; i <= worker_count; i += 1) {
    console.log('Starting worker #%d/%d', i, worker_count);
    cluster.fork();
  }
  if (process.env.NODE_ENV !== 'development') {
    cluster.on('exit', worker => {
      console.log('worker %d died, spawning a new worker...', worker.id);
      cluster.fork();
    });
  }
} else {
  console.log('Running on cluster worker process #%d', cluster.worker.id);
  const http         = require('http');
  const express      = require('express');
  const bodyParser   = require('body-parser');
  const cookieParser = require('cookie-parser');
  const session      = require('express-session');
  const engine       = require('ejs-locals');
  const favicon      = require('serve-favicon');
  /**
  * Create the application.
  */
  var app = express();

  /**
  * Environment and local variables
  */
  console.log("Version: %s (%s)", app_info.version, app.get('env'));
  debug("Debug is on");
  app.locals.git = { commit: undefined, branch: 'master' };
  gitrev.short(function(value)  { app.locals.git.commit = value; console.log('Git commit: ' + value); });
  gitrev.branch(function(value) { app.locals.git.branch = value; console.log('Git branch: ' + value); });
  gitrev.tag(function(value)    { app.locals.git.tag    = value; console.log('Git tag: '    + value); });
  app.locals.app_version = app_info.version;
  if (typeof(config.get('purecloud:organizations')) === 'string') {
    try {
      app.locals.purecloud = { organizations: JSON.parse(config.get('purecloud:organizations')) };
    } catch (error) {
      console.error("Error while parsing: %s", config.get('purecloud:organizations'));
      app.locals.purecloud = { organizations: [] };
    }
  } else {
    app.locals.purecloud   = { organizations: config.get('purecloud:organizations') };
  }
  debug('PureCloud Organizations: ', app.locals.purecloud);

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
    res.locals.purecloud_token = req.session.token;
    res.locals.purecloud_user  = req.session.user;
    res.locals.environment     = app.get('env');
    next();
  });


  // Application routes
  app.use('/',      require('../routes/index'));

  // Error routes
  app.use(function(req, res, next) { // catch 404 and forward to error handler
    var err = new Error('Not Found');
    err.status = 404;
    console.warn('Error: %m', err);
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
}
