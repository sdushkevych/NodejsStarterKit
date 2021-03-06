'use strict';

const worker = require('worker_threads');

const Application = require('./lib/application.js');
const resmon = require('./domain/resmon.js');
const utils = require('./domain/utils.js');
const startMonitoring = require('./init/logResources.js');

const application = new Application(worker);
application.sandboxInject({ utils, resmon });

application.on('started', () => {
  startMonitoring(application);
  application.logger.log(`Application started in worker ${worker.threadId}`);
});

worker.parentPort.on('message', async message => {
  if (message.name === 'stop') {
    if (application.finalization) return;
    application.logger.log(`Graceful shutdown in worker ${worker.threadId}`);
    await application.shutdown();
    process.exit(0);
  }
});

const logError = err => {
  application.logger.error(err.stack);
};

process.on('uncaughtException', logError);
process.on('warning', logError);
process.on('unhandledRejection', logError);
