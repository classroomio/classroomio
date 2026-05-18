#!/usr/bin/env tsx
'use strict';
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
exports.OpenAPISpecGenerator = void 0;
require('dotenv/config');
var client_s3_1 = require('@aws-sdk/client-s3');
var fs_1 = require('fs');
var app_1 = require('../src/app');
var env_1 = require('../src/config/env');
var hono_openapi_1 = require('hono-openapi');
var path_1 = require('path');
function filterPublicApiSpec(spec) {
  var _a, _b;
  var paths = (_a = spec.paths) !== null && _a !== void 0 ? _a : {};
  var publicApiPaths = Object.fromEntries(
    Object.entries(paths).filter(function (_a) {
      var path = _a[0];
      return path.startsWith('/public-api/v1/');
    })
  );
  var tags = Array.isArray(spec.tags)
    ? spec.tags.filter(function (tag) {
        if (!tag || typeof tag !== 'object' || !('name' in tag)) {
          return false;
        }
        return typeof tag.name === 'string' && tag.name.startsWith('Public API');
      })
    : undefined;
  return __assign(__assign({}, spec), {
    openapi: (_b = spec.openapi) !== null && _b !== void 0 ? _b : '3.1.0',
    info: {
      title: 'ClassroomIO Public API',
      version: '1.0.0',
      description: 'Public API for managing organizations, audience members, and courses in ClassroomIO.'
    },
    paths: publicApiPaths,
    tags: tags
  });
}
var OpenAPISpecGenerator = /** @class */ (function () {
  function OpenAPISpecGenerator() {
    this.s3Client = null;
    this.initializeS3Client();
  }
  OpenAPISpecGenerator.prototype.initializeS3Client = function () {
    if (env_1.env.CLOUDFLARE_ACCESS_KEY && env_1.env.CLOUDFLARE_SECRET_ACCESS_KEY && env_1.env.CLOUDFLARE_ACCOUNT_ID) {
      this.s3Client = new client_s3_1.S3Client({
        region: 'auto',
        endpoint: 'https://'.concat(env_1.env.CLOUDFLARE_ACCOUNT_ID, '.r2.cloudflarestorage.com'),
        credentials: {
          accessKeyId: env_1.env.CLOUDFLARE_ACCESS_KEY,
          secretAccessKey: env_1.env.CLOUDFLARE_SECRET_ACCESS_KEY
        }
      });
      console.log('✅ S3 client initialized for Cloudflare R2');
    } else {
      console.warn('⚠️  Cloudflare R2 credentials not found. Will only generate local spec file.');
    }
  };
  OpenAPISpecGenerator.prototype.generateSpec = function () {
    return __awaiter(this, void 0, void 0, function () {
      var spec, publicApiSpec, specString, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            console.log('🔄 Generating OpenAPI specification...');
            return [
              4 /*yield*/,
              (0, hono_openapi_1.generateSpecs)(app_1.app, {
                documentation: {
                  info: {
                    title: 'ClassroomIO API',
                    version: '1.0.0',
                    description: 'Manage your organization on classroomio via the API',
                    contact: {
                      name: 'ClassroomIO',
                      url: 'https://classroomio.com'
                    }
                  },
                  servers: [
                    {
                      url: 'https://api.classroomio.com',
                      description: 'Production environment'
                    },
                    {
                      url: 'http://localhost:3002',
                      description: 'Development environment'
                    }
                  ]
                }
              })
            ];
          case 1:
            spec = _a.sent();
            publicApiSpec = filterPublicApiSpec(spec);
            specString = JSON.stringify(publicApiSpec, null, 2);
            console.log('✅ OpenAPI specification generated successfully');
            return [2 /*return*/, specString];
          case 2:
            error_1 = _a.sent();
            console.error('❌ Error generating OpenAPI spec:', error_1);
            throw error_1;
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  OpenAPISpecGenerator.prototype.saveLocalSpec = function (spec) {
    return __awaiter(this, void 0, void 0, function () {
      var outputDir, filePath;
      return __generator(this, function (_a) {
        try {
          outputDir = (0, path_1.join)(process.cwd(), 'dist', 'openapi', 'public-api');
          (0, fs_1.mkdirSync)(outputDir, { recursive: true });
          filePath = (0, path_1.join)(outputDir, 'openapi.json');
          (0, fs_1.writeFileSync)(filePath, spec, 'utf8');
          console.log('\u2705 OpenAPI spec saved locally: '.concat(filePath));
          return [2 /*return*/, filePath];
        } catch (error) {
          console.error('❌ Error saving local spec:', error);
          throw error;
        }
        return [2 /*return*/];
      });
    });
  };
  OpenAPISpecGenerator.prototype.uploadToR2 = function (options) {
    return __awaiter(this, void 0, void 0, function () {
      var command, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.s3Client) {
              throw new Error('S3 client not initialized. Check your Cloudflare R2 credentials.');
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            console.log('\uD83D\uDD04 Uploading to R2 bucket');
            command = new client_s3_1.PutObjectCommand({
              Bucket: 'api',
              Key: options.key,
              Body: options.content,
              ContentType: options.contentType || 'application/json',
              CacheControl: 'public, max-age=3600' // Cache for 1 hour
            });
            return [4 /*yield*/, this.s3Client.send(command)];
          case 2:
            _a.sent();
            console.log('\u2705 Successfully uploaded to R2');
            return [3 /*break*/, 4];
          case 3:
            error_2 = _a.sent();
            console.error('❌ Error uploading to R2:', error_2);
            throw error_2;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  OpenAPISpecGenerator.prototype.generateAndUpload = function () {
    return __awaiter(this, void 0, void 0, function () {
      var spec, uploadKey, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 6, , 7]);
            return [4 /*yield*/, this.generateSpec()];
          case 1:
            spec = _a.sent();
            return [4 /*yield*/, this.saveLocalSpec(spec)];
          case 2:
            _a.sent();
            if (!this.s3Client) return [3 /*break*/, 5];
            uploadKey = 'openapi/public-api/openapi-'.concat(new Date().toISOString().split('T')[0], '.json');
            return [
              4 /*yield*/,
              this.uploadToR2({
                key: uploadKey,
                content: spec,
                contentType: 'application/json'
              })
            ];
          case 3:
            _a.sent();
            // Also upload as latest version
            return [
              4 /*yield*/,
              this.uploadToR2({
                key: 'openapi/public-api/openapi-latest.json',
                content: spec,
                contentType: 'application/json'
              })
            ];
          case 4:
            // Also upload as latest version
            _a.sent();
            _a.label = 5;
          case 5:
            console.log('🎉 OpenAPI spec generation and upload completed successfully!');
            return [3 /*break*/, 7];
          case 6:
            error_3 = _a.sent();
            console.error('❌ Failed to generate and upload OpenAPI spec:', error_3);
            process.exit(1);
            return [3 /*break*/, 7];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  return OpenAPISpecGenerator;
})();
exports.OpenAPISpecGenerator = OpenAPISpecGenerator;
// CLI interface
function main() {
  return __awaiter(this, void 0, void 0, function () {
    var args, generator;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          args = process.argv.slice(2);
          if (args.includes('--help') || args.includes('-h')) {
            console.log(
              '\nUsage: tsx scripts/upload-openapi-spec.ts\n\nExamples:\n  tsx scripts/upload-openapi-spec.ts\n\nEnvironment Variables Required for R2 Upload:\n  CLOUDFLARE_ACCESS_KEY\n  CLOUDFLARE_SECRET_ACCESS_KEY\n  CLOUDFLARE_ACCOUNT_ID\n    '
            );
            return [2 /*return*/];
          }
          generator = new OpenAPISpecGenerator();
          return [4 /*yield*/, generator.generateAndUpload()];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
// Run the script if called directly
if (process.argv[1] && process.argv[1].endsWith('upload-openapi-spec.ts')) {
  main()
    .then(function () {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(function (error) {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
