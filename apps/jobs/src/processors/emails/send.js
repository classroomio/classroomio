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
Object.defineProperty(exports, '__esModule', { value: true });
exports.processSendEmail = processSendEmail;
var email_1 = require('@cio/email');
var jobs_1 = require('@cio/jobs');
var logger_1 = require('../../utils/logger');
/**
 * Process an `emails:send` job. Dispatches based on payload `kind`, calls the
 * provider via `@cio/email`, and returns a provider message id (BullMQ stores
 * this as the job return value).
 */
function processSendEmail(rawPayload) {
  return __awaiter(this, void 0, void 0, function () {
    var payload, responses_1, result_1, responses, result;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          payload = jobs_1.ZSendEmailPayload.parse(rawPayload);
          if (!(payload.kind === 'template')) return [3 /*break*/, 2];
          return [
            4 /*yield*/,
            (0, email_1.sendEmail)(payload.template, {
              to: payload.to,
              // Re-validated by `sendEmail` against the registered template schema; the
              // generic record was already validated in the API helper before enqueue.
              fields: payload.fields,
              from: payload.from,
              replyTo: payload.replyTo
            })
          ];
        case 1:
          responses_1 = _a.sent();
          result_1 = extractProviderId(responses_1);
          logger_1.log.info('email-sent', {
            kind: 'template',
            template: payload.template,
            recipient: payload.to,
            providerId: result_1.providerId
          });
          return [2 /*return*/, result_1];
        case 2:
          return [
            4 /*yield*/,
            (0, email_1.deliverEmail)([
              {
                to: payload.to,
                subject: payload.subject,
                content: payload.content,
                from: payload.from,
                replyTo: payload.replyTo
              }
            ])
          ];
        case 3:
          responses = _a.sent();
          result = extractProviderId(responses);
          logger_1.log.info('email-sent', { kind: 'raw', recipient: payload.to, providerId: result.providerId });
          return [2 /*return*/, result];
      }
    });
  });
}
function extractProviderId(responses) {
  var _a, _b, _c, _d;
  var failed = responses.find(function (response) {
    return !response.success;
  });
  if (failed) {
    throw new Error(
      (_a = failed.error) !== null && _a !== void 0 ? _a : 'email provider returned an unsuccessful response'
    );
  }
  for (var _i = 0, responses_2 = responses; _i < responses_2.length; _i++) {
    var response = responses_2[_i];
    var details = response.details;
    var candidate =
      (_c =
        (_b = details === null || details === void 0 ? void 0 : details.messageId) !== null && _b !== void 0
          ? _b
          : details === null || details === void 0
            ? void 0
            : details.request_id) !== null && _c !== void 0
        ? _c
        : (_d = details === null || details === void 0 ? void 0 : details.data) === null || _d === void 0
          ? void 0
          : _d.request_id;
    if (candidate) {
      return { providerId: String(candidate) };
    }
  }
  return { providerId: '' };
}
