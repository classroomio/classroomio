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
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.AudioFileTooLargeError = exports.WHISPER_MAX_FILE_BYTES = void 0;
exports.transcribeAudioFile = transcribeAudioFile;
var node_fs_1 = require('node:fs');
var promises_1 = require('node:fs/promises');
var openai_1 = require('openai');
/** OpenAI audio transcription file size limit (bytes). */
exports.WHISPER_MAX_FILE_BYTES = 25 * 1024 * 1024;
var AudioFileTooLargeError = /** @class */ (function (_super) {
  __extends(AudioFileTooLargeError, _super);
  function AudioFileTooLargeError(fileSizeBytes) {
    var _this =
      _super.call(
        this,
        'Audio file '.concat(fileSizeBytes, ' bytes exceeds Whisper limit of ').concat(exports.WHISPER_MAX_FILE_BYTES)
      ) || this;
    _this.fileSizeBytes = fileSizeBytes;
    _this.code = 'AUDIO_TOO_LARGE';
    _this.name = 'AudioFileTooLargeError';
    return _this;
  }
  return AudioFileTooLargeError;
})(Error);
exports.AudioFileTooLargeError = AudioFileTooLargeError;
/**
 * Calls Whisper with verbose_json + segment timestamps. Omit `language` for
 * auto-detection; the API returns the detected ISO 639-1 code.
 */
function transcribeAudioFile(params) {
  return __awaiter(this, void 0, void 0, function () {
    var fileStat, client, response, language, durationSeconds, fullText, rawSegments, segments;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
      switch (_f.label) {
        case 0:
          return [4 /*yield*/, (0, promises_1.stat)(params.localPath)];
        case 1:
          fileStat = _f.sent();
          if (fileStat.size > exports.WHISPER_MAX_FILE_BYTES) {
            throw new AudioFileTooLargeError(fileStat.size);
          }
          client = new openai_1.default({ apiKey: params.apiKey });
          return [
            4 /*yield*/,
            client.audio.transcriptions.create(
              __assign(
                {
                  file: (0, node_fs_1.createReadStream)(params.localPath),
                  model: 'whisper-1',
                  response_format: 'verbose_json',
                  timestamp_granularities: ['segment']
                },
                params.language ? { language: params.language } : {}
              )
            )
          ];
        case 2:
          response = _f.sent();
          language = (_a = response.language) !== null && _a !== void 0 ? _a : 'und';
          durationSeconds = (_b = response.duration) !== null && _b !== void 0 ? _b : 0;
          fullText =
            (_d = (_c = response.text) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0
              ? _d
              : '';
          rawSegments = (_e = response.segments) !== null && _e !== void 0 ? _e : [];
          segments = rawSegments.map(function (seg) {
            return {
              start: seg.start,
              end: seg.end,
              text: seg.text.trim()
            };
          });
          return [
            2 /*return*/,
            { language: language, durationSeconds: durationSeconds, segments: segments, fullText: fullText }
          ];
      }
    });
  });
}
