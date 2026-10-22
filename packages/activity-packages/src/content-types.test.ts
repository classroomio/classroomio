import { describe, expect, it } from 'vitest';
import { contentTypeForFile } from './content-types.js';

describe('contentTypeForFile', () => {
  it('resolves known extensions case-insensitively', () => {
    expect(contentTypeForFile('index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeForFile('app.JS')).toBe('text/javascript; charset=utf-8');
    expect(contentTypeForFile('movie.mp4')).toBe('video/mp4');
    expect(contentTypeForFile('clip.m4v')).toBe('video/mp4');
    expect(contentTypeForFile('audio.ogg')).toBe('audio/ogg');
    expect(contentTypeForFile('audio.aac')).toBe('audio/aac');
    expect(contentTypeForFile('stream.m3u8')).toBe('application/vnd.apple.mpegurl');
    expect(contentTypeForFile('manifest.mpd')).toBe('application/dash+xml');
    expect(contentTypeForFile('engine.wasm')).toBe('application/wasm');
    expect(contentTypeForFile('font.woff2')).toBe('font/woff2');
  });

  it('falls back to bytes for unknown extensions', () => {
    expect(contentTypeForFile('data.xyz')).toBe('application/octet-stream');
    expect(contentTypeForFile('noextension')).toBe('application/octet-stream');
  });
});
