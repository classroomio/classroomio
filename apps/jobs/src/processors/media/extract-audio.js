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
exports.processExtractAudio = processExtractAudio;
var promises_1 = require('node:fs/promises');
var node_path_1 = require('node:path');
var node_os_1 = require('node:os');
var queries_1 = require('@cio/db/queries');
var media_1 = require('@cio/jobs/payloads/media');
var storage_1 = require('../../utils/storage');
var cancel_1 = require('../../utils/cancel');
var ffmpeg_1 = require('../../utils/ffmpeg');
var logger_1 = require('../../utils/logger');
var STEP_KEY = 'extract-audio';
var DOMAIN = 'media';
function transcodeToMp3(inputPath, outputPath) {
  return (0, ffmpeg_1.ffmpegRun)([
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-acodec',
    'libmp3lame',
    '-b:a',
    '32k',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-f',
    'mp3',
    outputPath
  ]);
}
/**
 * Extract a 16 kHz mono MP3 (32 kbps) from the source video for Whisper (25 MB
 * API limit). The transcribe step reads the object from the media bucket.
 */
function processExtractAudio(rawData) {
  return __awaiter(this, void 0, void 0, function () {
    var payload,
      mediaJobId,
      assetId,
      storageKey,
      existing,
      inputPath,
      outputPath,
      dir,
      audioKey,
      fileStat,
      result,
      error_1;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          payload = media_1.ZExtractAudioPayload.parse(rawData);
          ((mediaJobId = payload.mediaJobId), (assetId = payload.assetId), (storageKey = payload.storageKey));
          return [4 /*yield*/, (0, queries_1.getJobStep)(DOMAIN, mediaJobId, STEP_KEY)];
        case 1:
          existing = _b.sent();
          if (
            (existing === null || existing === void 0 ? void 0 : existing.status) === 'completed' &&
            existing.result
          ) {
            logger_1.log.info('extract-audio-skip', { mediaJobId: mediaJobId, reason: 'ledger-completed' });
            return [2 /*return*/, existing.result];
          }
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 2:
          _b.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { stage: 'extracting-audio', progressPercent: 70 })
          ];
        case 3:
          _b.sent();
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'running',
              startedAt: new Date().toISOString(),
              attempt:
                ((_a = existing === null || existing === void 0 ? void 0 : existing.attempt) !== null && _a !== void 0
                  ? _a
                  : 0) + 1
            })
          ];
        case 4:
          _b.sent();
          _b.label = 5;
        case 5:
          _b.trys.push([5, 14, 16, 19]);
          return [
            4 /*yield*/,
            (0, storage_1.downloadObjectToTempFile)((0, storage_1.videosBucket)(), storageKey, 'audio-source.bin')
          ];
        case 6:
          inputPath = _b.sent();
          dir = node_path_1.default.join((0, node_os_1.tmpdir)(), 'cio-jobs', 'audio');
          return [4 /*yield*/, (0, promises_1.mkdir)(dir, { recursive: true })];
        case 7:
          _b.sent();
          outputPath = node_path_1.default.join(dir, ''.concat(mediaJobId, '.mp3'));
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 8:
          _b.sent();
          return [4 /*yield*/, transcodeToMp3(inputPath, outputPath)];
        case 9:
          _b.sent();
          audioKey = 'audio/'.concat(assetId, '/').concat(mediaJobId, '.mp3');
          return [
            4 /*yield*/,
            (0, storage_1.uploadFileToBucket)(
              (0, storage_1.mediaBucket)(),
              audioKey,
              outputPath,
              'audio/mpeg',
              'private, max-age=0'
            )
          ];
        case 10:
          _b.sent();
          return [4 /*yield*/, (0, promises_1.stat)(outputPath)];
        case 11:
          fileStat = _b.sent();
          result = { bucket: (0, storage_1.mediaBucket)(), key: audioKey, fileSizeBytes: fileStat.size };
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'completed',
              finishedAt: new Date().toISOString(),
              result: result
            })
          ];
        case 12:
          _b.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { stage: 'audio-ready', progressPercent: 80 })
          ];
        case 13:
          _b.sent();
          logger_1.log.info('extract-audio-done', { mediaJobId: mediaJobId, audioKey: audioKey });
          return [2 /*return*/, result];
        case 14:
          error_1 = _b.sent();
          logger_1.log.error('extract-audio-failed', {
            mediaJobId: mediaJobId,
            error: (0, cancel_1.errorMessage)(error_1)
          });
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'failed',
              finishedAt: new Date().toISOString(),
              error: { code: 'EXTRACT_AUDIO_FAILED', message: (0, cancel_1.errorMessage)(error_1) }
            })
          ];
        case 15:
          _b.sent();
          throw error_1;
        case 16:
          return [4 /*yield*/, (0, storage_1.safeUnlink)(inputPath)];
        case 17:
          _b.sent();
          return [4 /*yield*/, (0, storage_1.safeUnlink)(outputPath)];
        case 18:
          _b.sent();
          return [7 /*endfinally*/];
        case 19:
          return [2 /*return*/];
      }
    });
  });
}
