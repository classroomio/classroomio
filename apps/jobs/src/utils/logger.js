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
Object.defineProperty(exports, '__esModule', { value: true });
exports.log = void 0;
function emit(level, message, fields) {
  if (fields === void 0) {
    fields = {};
  }
  var payload = __assign({ ts: new Date().toISOString(), level: level, msg: message }, fields);
  var stream = level === 'error' || level === 'warn' ? console.error : console.log;
  stream(JSON.stringify(payload));
}
exports.log = {
  debug: function (msg, fields) {
    return emit('debug', msg, fields);
  },
  info: function (msg, fields) {
    return emit('info', msg, fields);
  },
  warn: function (msg, fields) {
    return emit('warn', msg, fields);
  },
  error: function (msg, fields) {
    return emit('error', msg, fields);
  }
};
