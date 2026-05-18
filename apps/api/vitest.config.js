'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var node_path_1 = require('node:path');
var config_1 = require('vitest/config');
exports.default = (0, config_1.defineConfig)({
  resolve: {
    alias: {
      '@api': node_path_1.default.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
