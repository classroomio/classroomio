'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.segmentsToWebVtt = segmentsToWebVtt;
function formatVttTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    seconds = 0;
  }
  var totalMs = Math.round(seconds * 1000);
  var hours = Math.floor(totalMs / 3600000);
  var minutes = Math.floor((totalMs % 3600000) / 60000);
  var secs = Math.floor((totalMs % 60000) / 1000);
  var ms = totalMs % 1000;
  var pad = function (n, width) {
    return n.toString().padStart(width, '0');
  };
  return ''.concat(pad(hours, 2), ':').concat(pad(minutes, 2), ':').concat(pad(secs, 2), '.').concat(pad(ms, 3));
}
/**
 * Build a minimal WEBVTT caption file from Whisper segment timestamps.
 */
function segmentsToWebVtt(segments) {
  var lines = ['WEBVTT', ''];
  var cueIndex = 1;
  for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
    var segment = segments_1[_i];
    var text = segment.text.trim();
    if (!text) continue;
    var start = formatVttTime(segment.start);
    var end = formatVttTime(Math.max(segment.end, segment.start + 0.001));
    lines.push(String(cueIndex));
    lines.push(''.concat(start, ' --> ').concat(end));
    lines.push(text);
    lines.push('');
    cueIndex++;
  }
  return lines.join('\n');
}
