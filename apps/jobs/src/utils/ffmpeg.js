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
var _a, _b;
Object.defineProperty(exports, '__esModule', { value: true });
exports.FFPROBE_BIN = exports.FFMPEG_BIN = void 0;
exports.ffprobeJson = ffprobeJson;
exports.ffmpegRun = ffmpegRun;
exports.warnIfFfmpegMissing = warnIfFfmpegMissing;
var node_child_process_1 = require('node:child_process');
var node_util_1 = require('node:util');
var logger_1 = require('./logger');
var execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
/**
 * Resolved at module load. Set `FFMPEG_PATH` / `FFPROBE_PATH` to point at
 * non-default binary locations (e.g. when ffmpeg lives outside PATH for the
 * worker process). When unset we fall through to `ffmpeg` / `ffprobe` on
 * PATH, which is what most installs provide.
 */
exports.FFMPEG_BIN = (_a = process.env.FFMPEG_PATH) !== null && _a !== void 0 ? _a : 'ffmpeg';
exports.FFPROBE_BIN = (_b = process.env.FFPROBE_PATH) !== null && _b !== void 0 ? _b : 'ffprobe';
/** Cap subprocess stdout/stderr so a runaway log can't blow up the worker. */
var MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
/**
 * Run `ffprobe -print_format json -show_format -show_streams <file>` and
 * return the parsed JSON. Mirrors the shape we used to get from
 * `fluent-ffmpeg.ffprobe()` but without the deprecated wrapper.
 */
function ffprobeJson(localPath) {
  return __awaiter(this, void 0, void 0, function () {
    var args, stdout;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', localPath];
          return [4 /*yield*/, execFileAsync(exports.FFPROBE_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES })];
        case 1:
          stdout = _a.sent().stdout;
          return [2 /*return*/, JSON.parse(stdout)];
      }
    });
  });
}
/**
 * Spawn ffmpeg with the supplied argv. Captures stderr and surfaces a useful
 * tail in the error message when ffmpeg exits non-zero, since ffmpeg writes
 * progress and diagnostics to stderr by default.
 */
function ffmpegRun(args) {
  return __awaiter(this, void 0, void 0, function () {
    var error_1, stderr, tail;
    var _a, _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 2, , 3]);
          return [4 /*yield*/, execFileAsync(exports.FFMPEG_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES })];
        case 1:
          _c.sent();
          return [3 /*break*/, 3];
        case 2:
          error_1 = _c.sent();
          stderr =
            (_b =
              (_a = error_1 === null || error_1 === void 0 ? void 0 : error_1.stderr) === null || _a === void 0
                ? void 0
                : _a.toString('utf8')) !== null && _b !== void 0
              ? _b
              : '';
          tail = stderr.split('\n').filter(Boolean).slice(-5).join(' | ');
          throw new Error('ffmpeg exited with error'.concat(tail ? ': '.concat(tail) : ''), { cause: error_1 });
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Probe for the binaries at worker startup. Logs a warning when missing so
 * media jobs surface a clearer failure than a raw ENOENT from the first
 * spawn. Non-media workers (emails, maintenance) keep booting either way.
 */
function warnIfFfmpegMissing() {
  return __awaiter(this, void 0, void 0, function () {
    var checks, missing;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, Promise.all([isExecutable(exports.FFMPEG_BIN), isExecutable(exports.FFPROBE_BIN)])];
        case 1:
          checks = _a.sent();
          missing = [];
          if (!checks[0]) missing.push(exports.FFMPEG_BIN);
          if (!checks[1]) missing.push(exports.FFPROBE_BIN);
          if (missing.length === 0) {
            logger_1.log.info('ffmpeg-binaries-resolved', { ffmpeg: exports.FFMPEG_BIN, ffprobe: exports.FFPROBE_BIN });
            return [2 /*return*/];
          }
          logger_1.log.warn('ffmpeg-binaries-missing', {
            missing: missing,
            hint: 'Install ffmpeg (macOS: brew install ffmpeg, Debian/Ubuntu: apt install ffmpeg) or set FFMPEG_PATH / FFPROBE_PATH. Media jobs will fail until this is resolved; other workers are unaffected.'
          });
          return [2 /*return*/];
      }
    });
  });
}
function isExecutable(bin) {
  return __awaiter(this, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 2, , 3]);
          return [4 /*yield*/, execFileAsync(bin, ['-version'], { maxBuffer: MAX_OUTPUT_BYTES })];
        case 1:
          _b.sent();
          return [2 /*return*/, true];
        case 2:
          _a = _b.sent();
          return [2 /*return*/, false];
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
