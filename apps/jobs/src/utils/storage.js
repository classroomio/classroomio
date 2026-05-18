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
exports.downloadObjectToTempFile = downloadObjectToTempFile;
exports.uploadFileToBucket = uploadFileToBucket;
exports.uploadBufferToBucket = uploadBufferToBucket;
exports.safeUnlink = safeUnlink;
exports.videosBucket = videosBucket;
exports.mediaBucket = mediaBucket;
var client_s3_1 = require('@aws-sdk/client-s3');
var node_fs_1 = require('node:fs');
var promises_1 = require('node:fs/promises');
var node_os_1 = require('node:os');
var node_path_1 = require('node:path');
var promises_2 = require('node:stream/promises');
var storage_1 = require('../config/storage');
/**
 * Streams an S3 object to a temp file on disk and returns the absolute path.
 * Workers prefer disk over buffers so ffmpeg can seek without holding the
 * whole video in RAM.
 */
function downloadObjectToTempFile(bucket, key, fileNameHint) {
  return __awaiter(this, void 0, void 0, function () {
    var dir, safeName, localPath, response, body;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          dir = node_path_1.default.join((0, node_os_1.tmpdir)(), 'cio-jobs');
          return [4 /*yield*/, (0, promises_1.mkdir)(dir, { recursive: true })];
        case 1:
          _b.sent();
          safeName =
            (_a =
              fileNameHint === null || fileNameHint === void 0
                ? void 0
                : fileNameHint.replace(/[^a-zA-Z0-9._-]/g, '_')) !== null && _a !== void 0
              ? _a
              : 'media';
          localPath = node_path_1.default.join(
            dir,
            ''.concat(Date.now(), '_').concat(process.pid, '_').concat(safeName)
          );
          return [
            4 /*yield*/,
            (0, storage_1.getS3Client)().send(new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: key }))
          ];
        case 2:
          response = _b.sent();
          if (!response.Body) {
            throw new Error('S3 object '.concat(bucket, '/').concat(key, ' returned no body'));
          }
          body = response.Body;
          return [4 /*yield*/, (0, promises_2.pipeline)(body, (0, node_fs_1.createWriteStream)(localPath))];
        case 3:
          _b.sent();
          return [2 /*return*/, localPath];
      }
    });
  });
}
function uploadFileToBucket(bucket, key, localPath, contentType, cacheControl) {
  return __awaiter(this, void 0, void 0, function () {
    var buffer;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, (0, promises_1.readFile)(localPath)];
        case 1:
          buffer = _a.sent();
          return [
            4 /*yield*/,
            (0, storage_1.getS3Client)().send(
              new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: cacheControl
              })
            )
          ];
        case 2:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
function uploadBufferToBucket(bucket, key, buffer, contentType, cacheControl) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            (0, storage_1.getS3Client)().send(
              new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: cacheControl
              })
            )
          ];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
function safeUnlink(filePath) {
  return __awaiter(this, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          if (!filePath) return [2 /*return*/];
          _b.label = 1;
        case 1:
          _b.trys.push([1, 3, , 4]);
          return [4 /*yield*/, (0, promises_1.unlink)(filePath)];
        case 2:
          _b.sent();
          return [3 /*break*/, 4];
        case 3:
          _a = _b.sent();
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
function videosBucket() {
  return (0, storage_1.getStorageConfig)().bucketVideos;
}
function mediaBucket() {
  return (0, storage_1.getStorageConfig)().bucketMedia;
}
