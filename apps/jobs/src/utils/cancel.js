'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
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
exports.JobCanceledError = void 0;
exports.isMediaJobCancelRequested = isMediaJobCancelRequested;
exports.throwIfCancelRequested = throwIfCancelRequested;
exports.errorMessage = errorMessage;
var jobs_1 = require('@cio/db/queries/jobs');
var logger_1 = require('./logger');
/**
 * Lightweight cooperative cancellation. Workers check `isCancelRequested` at
 * step boundaries and inside long ffmpeg/fetch loops. The plan calls for
 * `cancelRequestedAt` on each run table, with the worker abandoning further
 * work the moment it observes a request.
 */
var JobCanceledError = /** @class */ (function (_super) {
  __extends(JobCanceledError, _super);
  function JobCanceledError(mediaJobId) {
    var _this = _super.call(this, 'Media job '.concat(mediaJobId, ' canceled by user request')) || this;
    _this.mediaJobId = mediaJobId;
    _this.name = 'JobCanceledError';
    return _this;
  }
  return JobCanceledError;
})(Error);
exports.JobCanceledError = JobCanceledError;
function isMediaJobCancelRequested(mediaJobId) {
  return __awaiter(this, void 0, void 0, function () {
    var job, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [4 /*yield*/, (0, jobs_1.getMediaJobById)(mediaJobId)];
        case 1:
          job = _a.sent();
          return [2 /*return*/, Boolean(job === null || job === void 0 ? void 0 : job.cancelRequestedAt)];
        case 2:
          error_1 = _a.sent();
          logger_1.log.warn('cancel-check-failed', { mediaJobId: mediaJobId, error: errorMessage(error_1) });
          return [2 /*return*/, false];
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
function throwIfCancelRequested(mediaJobId) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, isMediaJobCancelRequested(mediaJobId)];
        case 1:
          if (_a.sent()) {
            throw new JobCanceledError(mediaJobId);
          }
          return [2 /*return*/];
      }
    });
  });
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
