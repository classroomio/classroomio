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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.processTranscribeAudio = processTranscribeAudio;
var promises_1 = require('node:fs/promises');
var queries_1 = require('@cio/db/queries');
var media_1 = require('@cio/jobs/payloads/media');
var env_1 = require('../../config/env');
var openai_1 = require('../../services/transcription/openai');
var vtt_1 = require('../../services/transcription/vtt');
var storage_1 = require('../../utils/storage');
var cancel_1 = require('../../utils/cancel');
var logger_1 = require('../../utils/logger');
var STEP_KEY = 'transcribe-audio';
var DOMAIN = 'media';
var EXTRACT_STEP_KEY = 'extract-audio';
function transcriptionCostCents(durationSeconds) {
  return Math.ceil((durationSeconds / 60) * 0.6);
}
function mergeJobWarnings(mediaJobId, extra) {
  return __awaiter(this, void 0, void 0, function () {
    var job, prior;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          return [4 /*yield*/, (0, queries_1.getMediaJobById)(mediaJobId)];
        case 1:
          job = _b.sent();
          prior = (_a = job === null || job === void 0 ? void 0 : job.warnings) !== null && _a !== void 0 ? _a : [];
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              warnings: __spreadArray(__spreadArray([], prior, true), extra, true)
            })
          ];
        case 2:
          _b.sent();
          return [2 /*return*/];
      }
    });
  });
}
/**
 * OpenAI Whisper (`whisper-1`) with verbose segment timestamps; persists VTT +
 * `media_transcript` row. Skips cleanly when `OPENAI_API_KEY` is unset or when
 * extracted audio exceeds the 25 MB API limit.
 */
function processTranscribeAudio(rawData) {
  return __awaiter(this, void 0, void 0, function () {
    var payload,
      mediaJobId,
      assetId,
      actorContext,
      existing,
      result,
      extractStep,
      extractResult,
      message,
      localPath,
      localStat,
      whisper,
      normalizedSegments,
      vttBody,
      vttKey,
      bucket,
      transcriptCost,
      jobRow,
      priorCost,
      result,
      error_1,
      error_2;
    var _a, _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          payload = media_1.ZTranscribeAudioPayload.parse(rawData);
          ((mediaJobId = payload.mediaJobId), (assetId = payload.assetId), (actorContext = payload.actorContext));
          return [4 /*yield*/, (0, queries_1.getJobStep)(DOMAIN, mediaJobId, STEP_KEY)];
        case 1:
          existing = _c.sent();
          if (
            (existing === null || existing === void 0 ? void 0 : existing.status) === 'completed' &&
            existing.result
          ) {
            logger_1.log.info('transcribe-audio-skip', { mediaJobId: mediaJobId, reason: 'ledger-completed' });
            return [2 /*return*/, existing.result];
          }
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 2:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, { stage: 'transcribing', progressPercent: 90 })
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
                ((_a = existing === null || existing === void 0 ? void 0 : existing.attempt) !== null && _a !== void 0
                  ? _a
                  : 0) + 1
            })
          ];
        case 4:
          _c.sent();
          _c.label = 5;
        case 5:
          _c.trys.push([5, 35, , 37]);
          if (!!env_1.env.OPENAI_API_KEY) return [3 /*break*/, 9];
          result = { provider: 'skipped', text: '' };
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
        case 6:
          _c.sent();
          return [4 /*yield*/, mergeJobWarnings(mediaJobId, ['transcription-skipped-no-openai-key'])];
        case 7:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              status: 'completed',
              stage: 'done',
              progressPercent: 100
            })
          ];
        case 8:
          _c.sent();
          logger_1.log.info('transcribe-audio-skipped', { mediaJobId: mediaJobId, reason: 'no-openai-key' });
          return [2 /*return*/, result];
        case 9:
          return [4 /*yield*/, (0, queries_1.getJobStep)(DOMAIN, mediaJobId, EXTRACT_STEP_KEY)];
        case 10:
          extractStep = _c.sent();
          extractResult = extractStep === null || extractStep === void 0 ? void 0 : extractStep.result;
          if (
            !(
              !(extractResult === null || extractResult === void 0 ? void 0 : extractResult.bucket) ||
              !(extractResult === null || extractResult === void 0 ? void 0 : extractResult.key)
            )
          )
            return [3 /*break*/, 12];
          message = 'extract-audio step missing or incomplete';
          logger_1.log.error('transcribe-audio-failed', { mediaJobId: mediaJobId, error: message });
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'failed',
              finishedAt: new Date().toISOString(),
              error: { code: 'EXTRACT_AUDIO_MISSING', message: message }
            })
          ];
        case 11:
          _c.sent();
          throw new Error(message);
        case 12:
          localPath = void 0;
          _c.label = 13;
        case 13:
          _c.trys.push([13, 27, 32, 34]);
          return [
            4 /*yield*/,
            (0, storage_1.downloadObjectToTempFile)(extractResult.bucket, extractResult.key, 'whisper-input.mp3')
          ];
        case 14:
          localPath = _c.sent();
          return [4 /*yield*/, (0, promises_1.stat)(localPath)];
        case 15:
          localStat = _c.sent();
          if (!(localStat.size > openai_1.WHISPER_MAX_FILE_BYTES)) return [3 /*break*/, 19];
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'failed',
              finishedAt: new Date().toISOString(),
              error: {
                code: 'AUDIO_TOO_LARGE',
                message: 'Audio '.concat(localStat.size, ' bytes exceeds ').concat(openai_1.WHISPER_MAX_FILE_BYTES)
              }
            })
          ];
        case 16:
          _c.sent();
          return [4 /*yield*/, mergeJobWarnings(mediaJobId, ['transcription-skipped-audio-too-large'])];
        case 17:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              status: 'completed',
              stage: 'done',
              progressPercent: 100
            })
          ];
        case 18:
          _c.sent();
          logger_1.log.warn('transcribe-audio-skipped-audio-too-large', {
            mediaJobId: mediaJobId,
            fileSizeBytes: localStat.size
          });
          return [2 /*return*/, { provider: 'skipped', text: '' }];
        case 19:
          return [4 /*yield*/, (0, cancel_1.throwIfCancelRequested)(mediaJobId)];
        case 20:
          _c.sent();
          return [
            4 /*yield*/,
            (0, openai_1.transcribeAudioFile)({
              apiKey: env_1.env.OPENAI_API_KEY,
              localPath: localPath
            })
          ];
        case 21:
          whisper = _c.sent();
          normalizedSegments = whisper.segments.map(function (segment) {
            return {
              start: segment.start,
              end: segment.end,
              text: segment.text
            };
          });
          vttBody = (0, vtt_1.segmentsToWebVtt)(normalizedSegments);
          vttKey = 'transcripts/'.concat(assetId, '/').concat(mediaJobId, '.vtt');
          bucket = (0, storage_1.mediaBucket)();
          return [
            4 /*yield*/,
            (0, storage_1.uploadBufferToBucket)(
              bucket,
              vttKey,
              Buffer.from(vttBody, 'utf8'),
              'text/vtt; charset=utf-8',
              'private, max-age=0'
            )
          ];
        case 22:
          _c.sent();
          transcriptCost = transcriptionCostCents(whisper.durationSeconds);
          return [4 /*yield*/, (0, queries_1.getMediaJobById)(mediaJobId)];
        case 23:
          jobRow = _c.sent();
          priorCost =
            (_b = jobRow === null || jobRow === void 0 ? void 0 : jobRow.costCents) !== null && _b !== void 0 ? _b : 0;
          return [
            4 /*yield*/,
            (0, queries_1.upsertMediaTranscript)({
              organizationId: actorContext.organizationId,
              assetId: assetId,
              mediaJobId: mediaJobId,
              language: whisper.language,
              provider: 'openai',
              model: 'whisper-1',
              text:
                whisper.fullText ||
                normalizedSegments
                  .map(function (segment) {
                    return segment.text;
                  })
                  .join(' ')
                  .trim(),
              segments: normalizedSegments,
              vttStorageKey: vttKey,
              vttBucket: bucket,
              durationSeconds: Math.round(whisper.durationSeconds),
              costCents: transcriptCost
            })
          ];
        case 24:
          _c.sent();
          result = {
            provider: 'openai',
            text: whisper.fullText,
            language: whisper.language,
            durationSeconds: whisper.durationSeconds,
            costCents: transcriptCost
          };
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'completed',
              finishedAt: new Date().toISOString(),
              result: {
                language: whisper.language,
                segmentCount: normalizedSegments.length,
                vttKey: vttKey,
                costCents: transcriptCost
              },
              providerId: null
            })
          ];
        case 25:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              status: 'completed',
              stage: 'done',
              progressPercent: 100,
              costCents: priorCost + transcriptCost
            })
          ];
        case 26:
          _c.sent();
          logger_1.log.info('transcribe-audio-done', {
            mediaJobId: mediaJobId,
            language: whisper.language,
            segmentCount: normalizedSegments.length
          });
          return [2 /*return*/, result];
        case 27:
          error_1 = _c.sent();
          if (!(error_1 instanceof openai_1.AudioFileTooLargeError)) return [3 /*break*/, 31];
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'failed',
              finishedAt: new Date().toISOString(),
              error: { code: 'AUDIO_TOO_LARGE', message: error_1.message }
            })
          ];
        case 28:
          _c.sent();
          return [4 /*yield*/, mergeJobWarnings(mediaJobId, ['transcription-skipped-audio-too-large'])];
        case 29:
          _c.sent();
          return [
            4 /*yield*/,
            (0, queries_1.updateMediaJob)(mediaJobId, {
              status: 'completed',
              stage: 'done',
              progressPercent: 100
            })
          ];
        case 30:
          _c.sent();
          logger_1.log.warn('transcribe-audio-skipped-audio-too-large', {
            mediaJobId: mediaJobId,
            fileSizeBytes: error_1.fileSizeBytes
          });
          return [2 /*return*/, { provider: 'skipped', text: '' }];
        case 31:
          throw error_1;
        case 32:
          return [4 /*yield*/, (0, storage_1.safeUnlink)(localPath)];
        case 33:
          _c.sent();
          return [7 /*endfinally*/];
        case 34:
          return [3 /*break*/, 37];
        case 35:
          error_2 = _c.sent();
          logger_1.log.error('transcribe-audio-failed', {
            mediaJobId: mediaJobId,
            error: (0, cancel_1.errorMessage)(error_2)
          });
          return [
            4 /*yield*/,
            (0, queries_1.upsertJobStep)({
              domain: DOMAIN,
              runId: mediaJobId,
              stepKey: STEP_KEY,
              status: 'failed',
              finishedAt: new Date().toISOString(),
              error: { code: 'TRANSCRIBE_FAILED', message: (0, cancel_1.errorMessage)(error_2) }
            })
          ];
        case 36:
          _c.sent();
          throw error_2;
        case 37:
          return [2 /*return*/];
      }
    });
  });
}
