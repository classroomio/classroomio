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
exports.processProbeMetadata = processProbeMetadata;
var promises_1 = require('node:fs/promises');
var queries_1 = require('@cio/db/queries');
var media_1 = require('@cio/jobs/payloads/media');
var storage_1 = require('../../utils/storage');
var cancel_1 = require('../../utils/cancel');
var ffmpeg_1 = require('../../utils/ffmpeg');
var logger_1 = require('../../utils/logger');
var STEP_KEY = 'probe-metadata';
var DOMAIN = 'media';
function parseProbe(metadata, fileSizeBytes) {
  var _a, _b;
  var videoStream = metadata.streams.find(function (stream) {
    return stream.codec_type === 'video';
  });
  var audioStream = metadata.streams.find(function (stream) {
    return stream.codec_type === 'audio';
  });
  var duration = Number(
    (_b =
      (_a = metadata.format.duration) !== null && _a !== void 0
        ? _a
        : videoStream === null || videoStream === void 0
          ? void 0
          : videoStream.duration) !== null && _b !== void 0
      ? _b
      : 0
  );
  return {
    durationSeconds: Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0,
    width: videoStream === null || videoStream === void 0 ? void 0 : videoStream.width,
    height: videoStream === null || videoStream === void 0 ? void 0 : videoStream.height,
    videoCodec: videoStream === null || videoStream === void 0 ? void 0 : videoStream.codec_name,
    audioCodec: audioStream === null || audioStream === void 0 ? void 0 : audioStream.codec_name,
    hasAudio: Boolean(audioStream),
    fileSizeBytes: fileSizeBytes
  };
}
/**
 * Probe authoritative metadata (duration, codecs, dimensions) using ffprobe.
 * Replaces the browser-derived duration on the asset row.
 */
function processProbeMetadata(rawData) {
  return __awaiter(this, void 0, void 0, function () {
    var payload, mediaJobId, assetId, storageKey, actorContext, existing, localPath, fileStat, probe, result, error_1;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          payload = media_1.ZProbeMetadataPayload.parse(rawData);
          ((mediaJobId = payload.mediaJobId),
            (assetId = payload.assetId),
            (storageKey = payload.storageKey),
            (actorContext = payload.actorContext));
          return [4 /*yield*/, (0, queries_1.getJobStep)(DOMAIN, mediaJobId, STEP_KEY)];
        case 1:
          existing = _b.sent();
          if (
            (existing === null || existing === void 0 ? void 0 : existing.status) === 'completed' &&
            existing.result
          ) {
            logger_1.log.info('probe-metadata-skip', { mediaJobId: mediaJobId, reason: 'ledger-completed' });
            return [2 /*return*/, existing.result];
          }
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 2:
          _b.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { status: 'running', stage: 'probing', progressPercent: 5 })
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
          _b.trys.push([5, 13, 15, 17]);
          return [
            4 /*yield*/,
            (0, storage_1.downloadObjectToTempFile)((0, storage_1.videosBucket)(), storageKey, 'source.bin')
          ];
        case 6:
          localPath = _b.sent();
          return [4 /*yield*/, (0, promises_1.stat)(localPath)];
        case 7:
          fileStat = _b.sent();
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 8:
          _b.sent();
          return [4 /*yield*/, (0, ffmpeg_1.ffprobeJson)(localPath)];
        case 9:
          probe = _b.sent();
          result = parseProbe(probe, fileStat.size);
          return [
            4 /*yield*/,
            (0, queries_1.updateAsset)(assetId, actorContext.organizationId, {
              durationSeconds: result.durationSeconds,
              aspectRatio: result.width && result.height ? ''.concat(result.width, ':').concat(result.height) : null,
              metadata: {
                probe: {
                  durationSeconds: result.durationSeconds,
                  width: result.width,
                  height: result.height,
                  videoCodec: result.videoCodec,
                  audioCodec: result.audioCodec,
                  hasAudio: result.hasAudio,
                  fileSizeBytes: result.fileSizeBytes,
                  probedAt: new Date().toISOString()
                }
              }
            })
          ];
        case 10:
          _b.sent();
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
        case 11:
          _b.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              stage: 'probed',
              progressPercent: 25
            })
          ];
        case 12:
          _b.sent();
          logger_1.log.info('probe-metadata-done', { mediaJobId: mediaJobId, durationSeconds: result.durationSeconds });
          return [2 /*return*/, result];
        case 13:
          error_1 = _b.sent();
          logger_1.log.error('probe-metadata-failed', {
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
              error: { code: 'PROBE_FAILED', message: (0, cancel_1.errorMessage)(error_1) }
            })
          ];
        case 14:
          _b.sent();
          throw error_1;
        case 15:
          return [4 /*yield*/, (0, storage_1.safeUnlink)(localPath)];
        case 16:
          _b.sent();
          return [7 /*endfinally*/];
        case 17:
          return [2 /*return*/];
      }
    });
  });
}
