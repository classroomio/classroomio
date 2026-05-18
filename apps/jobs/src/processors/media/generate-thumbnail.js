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
exports.processGenerateThumbnail = processGenerateThumbnail;
var promises_1 = require('node:fs/promises');
var node_path_1 = require('node:path');
var node_os_1 = require('node:os');
var queries_1 = require('@cio/db/queries');
var media_1 = require('@cio/jobs/payloads/media');
var storage_1 = require('../../utils/storage');
var cancel_1 = require('../../utils/cancel');
var storage_2 = require('../../config/storage');
var ffmpeg_1 = require('../../utils/ffmpeg');
var logger_1 = require('../../utils/logger');
var STEP_KEY = 'generate-thumbnail';
var DOMAIN = 'media';
function extractThumbnail(localPath, atSeconds, outputPath) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            (0, ffmpeg_1.ffmpegRun)([
              '-y',
              '-ss',
              String(atSeconds),
              '-i',
              localPath,
              '-vframes',
              '1',
              '-vf',
              'scale=640:-1',
              outputPath
            ])
          ];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Render a single JPEG frame to use as the asset thumbnail. Replaces the
 * browser-side thumbnail as the source of truth on the asset row.
 */
function processGenerateThumbnail(rawData) {
  return __awaiter(this, void 0, void 0, function () {
    var payload,
      mediaJobId,
      assetId,
      storageKey,
      actorContext,
      _a,
      atSeconds,
      existing,
      localPath,
      outputPath,
      dir,
      buffer,
      thumbKey,
      baseUrl,
      publicUrl,
      result,
      error_1;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          payload = media_1.ZGenerateThumbnailPayload.parse(rawData);
          ((mediaJobId = payload.mediaJobId),
            (assetId = payload.assetId),
            (storageKey = payload.storageKey),
            (actorContext = payload.actorContext),
            (_a = payload.atSeconds),
            (atSeconds = _a === void 0 ? 1.0 : _a));
          return [4 /*yield*/, (0, queries_1.getJobStep)(DOMAIN, mediaJobId, STEP_KEY)];
        case 1:
          existing = _c.sent();
          if (
            (existing === null || existing === void 0 ? void 0 : existing.status) === 'completed' &&
            existing.result
          ) {
            logger_1.log.info('generate-thumbnail-skip', { mediaJobId: mediaJobId, reason: 'ledger-completed' });
            return [2 /*return*/, existing.result];
          }
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 2:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { stage: 'thumbnailing', progressPercent: 35 })
          ];
        case 3:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'running',
              startedAt: new Date().toISOString(),
              attempt:
                ((_b = existing === null || existing === void 0 ? void 0 : existing.attempt) !== null && _b !== void 0
                  ? _b
                  : 0) + 1
            })
          ];
        case 4:
          _c.sent();
          _c.label = 5;
        case 5:
          _c.trys.push([5, 15, 17, 20]);
          return [
            4 /*yield*/,
            (0, storage_1.downloadObjectToTempFile)((0, storage_1.videosBucket)(), storageKey, 'thumb-source.bin')
          ];
        case 6:
          localPath = _c.sent();
          dir = node_path_1.default.join((0, node_os_1.tmpdir)(), 'cio-jobs', 'thumbs');
          return [4 /*yield*/, (0, promises_1.mkdir)(dir, { recursive: true })];
        case 7:
          _c.sent();
          outputPath = node_path_1.default.join(dir, ''.concat(mediaJobId, '.jpg'));
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 8:
          _c.sent();
          return [4 /*yield*/, extractThumbnail(localPath, atSeconds, outputPath)];
        case 9:
          _c.sent();
          return [4 /*yield*/, (0, promises_1.readFile)(outputPath)];
        case 10:
          buffer = _c.sent();
          thumbKey = 'thumbnails/'.concat(assetId, '/').concat(Date.now(), '.jpg');
          return [
            4 /*yield*/,
            (0, storage_1.uploadBufferToBucket)(
              (0, storage_1.mediaBucket)(),
              thumbKey,
              buffer,
              'image/jpeg',
              'public, max-age=31536000'
            )
          ];
        case 11:
          _c.sent();
          baseUrl = (0, storage_2.getStorageConfig)().mediaPublicBaseUrl;
          publicUrl = baseUrl ? ''.concat(baseUrl.replace(/\/$/, ''), '/').concat(thumbKey) : null;
          result = { bucket: (0, storage_1.mediaBucket)(), key: thumbKey, publicUrl: publicUrl };
          return [
            4 /*yield*/,
            (0, queries_1.updateAsset)(assetId, actorContext.organizationId, {
              thumbnailUrl: publicUrl !== null && publicUrl !== void 0 ? publicUrl : undefined
            })
          ];
        case 12:
          _c.sent();
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
        case 13:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { stage: 'thumbnailed', progressPercent: 60 })
          ];
        case 14:
          _c.sent();
          logger_1.log.info('generate-thumbnail-done', { mediaJobId: mediaJobId, thumbKey: thumbKey });
          return [2 /*return*/, result];
        case 15:
          error_1 = _c.sent();
          logger_1.log.error('generate-thumbnail-failed', {
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
              error: { code: 'THUMBNAIL_FAILED', message: (0, cancel_1.errorMessage)(error_1) }
            })
          ];
        case 16:
          _c.sent();
          throw error_1;
        case 17:
          return [4 /*yield*/, (0, storage_1.safeUnlink)(localPath)];
        case 18:
          _c.sent();
          return [4 /*yield*/, (0, storage_1.safeUnlink)(outputPath)];
        case 19:
          _c.sent();
          return [7 /*endfinally*/];
        case 20:
          return [2 /*return*/];
      }
    });
  });
}
