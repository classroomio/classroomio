'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var _a;
Object.defineProperty(exports, '__esModule', { value: true });
require('./../bootstrap');
var bullmq_1 = require('bullmq');
var queries_1 = require('@cio/db/queries');
var jobs_1 = require('@cio/jobs');
var cancel_1 = require('../utils/cancel');
var env_1 = require('../config/env');
var logger_1 = require('../utils/logger');
var emails_1 = require('../processors/emails');
var concurrency =
  Number.parseInt((_a = env_1.env.EMAIL_WORKER_CONCURRENCY) !== null && _a !== void 0 ? _a : '5', 10) || 5;
var connection = (0, jobs_1.createRedisConnection)();
var worker = new bullmq_1.Worker(
  jobs_1.QUEUE_NAMES.emails,
  function (job) {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        logger_1.log.info('email-job-start', {
          jobName: job.name,
          bullmqJobId: job.id,
          attempt: job.attemptsMade + 1
        });
        switch (job.name) {
          case jobs_1.JOB_NAMES.emails.send:
            return [2 /*return*/, (0, emails_1.processSendEmail)(job.data)];
          default:
            throw new Error('Unknown emails job: '.concat(job.name));
        }
        return [2 /*return*/];
      });
    });
  },
  { connection: connection, concurrency: concurrency }
);
worker.on('failed', function (job, err) {
  return __awaiter(void 0, void 0, void 0, function () {
    var isFinalAttempt;
    var _a, _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          if (!job) return [2 /*return*/];
          logger_1.log.error('email-job-failed', {
            jobName: job.name,
            bullmqJobId: job.id,
            attempt: job.attemptsMade,
            error: (0, cancel_1.errorMessage)(err)
          });
          isFinalAttempt = job.attemptsMade >= ((_a = job.opts.attempts) !== null && _a !== void 0 ? _a : 1);
          if (!isFinalAttempt) return [2 /*return*/];
          // BullMQ exhausted retries — write a dead-letter row so an operator can
          // inspect the payload + error and replay if needed.
          return [
            4 /*yield*/,
            (0, queries_1.recordDeadLetterJob)({
              organizationId: null,
              domain: 'emails',
              runId: null,
              queueName: jobs_1.QUEUE_NAMES.emails,
              jobName: job.name,
              bullmqJobId: (_b = job.id) !== null && _b !== void 0 ? _b : null,
              payload: job.data,
              error: { code: 'WORKER_EXHAUSTED_RETRIES', message: (0, cancel_1.errorMessage)(err), stack: err.stack },
              attempts: job.attemptsMade
            })
          ];
        case 1:
          // BullMQ exhausted retries — write a dead-letter row so an operator can
          // inspect the payload + error and replay if needed.
          _c.sent();
          return [2 /*return*/];
      }
    });
  });
});
worker.on('ready', function () {
  return logger_1.log.info('email-worker-ready', { concurrency: concurrency, queue: jobs_1.QUEUE_NAMES.emails });
});
worker.on('error', function (err) {
  return logger_1.log.error('email-worker-error', { error: (0, cancel_1.errorMessage)(err) });
});
var shutdown = function (signal) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          logger_1.log.info('email-worker-shutdown', { signal: signal });
          return [4 /*yield*/, worker.close()];
        case 1:
          _a.sent();
          return [4 /*yield*/, connection.quit()];
        case 2:
          _a.sent();
          process.exit(0);
          return [2 /*return*/];
      }
    });
  });
};
process.on('SIGTERM', function () {
  return void shutdown('SIGTERM');
});
process.on('SIGINT', function () {
  return void shutdown('SIGINT');
});
