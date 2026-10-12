import { describe, expect, it } from 'vitest';
import { contentTypeForFile } from './content-types.js';

describe('contentTypeForFile', () => {
  it('resolves known extensions case-insensitively', () => {
    expect(contentTypeForFile('index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeForFile('app.JS')).toBe('text/javascript; charset=utf-8');
    expect(contentTypeForFile('movie.mp4')).toBe('video/mp4');
    expect(contentTypeForFile('font.woff2')).toBe('font/woff2');
  });

  it('falls back to bytes for unknown extensions', () => {
    expect(contentTypeForFile('data.xyz')).toBe('application/octet-stream');
    expect(contentTypeForFile('noextension')).toBe('application/octet-stream');
  });
});
