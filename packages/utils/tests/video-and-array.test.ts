import { describe, expect, it } from 'vitest';
import { dedupe } from '../src/functions/array';
import { extractUniqueLinks } from '../src/functions/links';
import { toCanonicalVimeoUrl } from '../src/functions/vimeo';
import { toCanonicalYoutubeUrl } from '../src/functions/youtube';
import { getVideoMediaType, getVideoType, isGoogleDriveUrl } from '../src/functions/video';

describe('dedupe', () => {
  it('removes duplicate primitive values while preserving order', () => {
    const input = ['https://vimeo.com/1', 'https://vimeo.com/2', 'https://vimeo.com/1', 'https://vimeo.com/3'];
    expect(dedupe(input)).toEqual(['https://vimeo.com/1', 'https://vimeo.com/2', 'https://vimeo.com/3']);
  });

  it('handles empty or non-array inputs safely', () => {
    expect(dedupe([])).toEqual([]);
    expect(dedupe(null as unknown as unknown[])).toEqual([]);
  });

  it('supports an optional key mapper for objects', () => {
    const items = [
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' },
      { id: '1', title: 'First Duplicate' }
    ];
    const result = dedupe(items, (item) => item.id);
    expect(result).toEqual([
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' }
    ]);
  });
});

describe('extractUniqueLinks', () => {
  it('splits and dedupes links without a transform function', () => {
    const input = 'https://vimeo.com/1, https://vimeo.com/2, https://vimeo.com/1';
    expect(extractUniqueLinks(input)).toEqual(['https://vimeo.com/1', 'https://vimeo.com/2']);
  });

  it('splits, transforms with canonicalizer, filters invalid, and dedupes', () => {
    const input = 'https://vimeo.com/12345, invalid-link, https://vimeo.com/12345, vimeo.com/67890';
    const result = extractUniqueLinks(input, toCanonicalVimeoUrl);
    expect(result).toEqual(['https://vimeo.com/12345', 'https://vimeo.com/67890']);
  });

  it('works with YouTube canonicalizer and iframe snippets', () => {
    const input = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>, https://youtu.be/dQw4w9WgXcQ';
    const result = extractUniqueLinks(input, toCanonicalYoutubeUrl);
    expect(result).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
  });

  it('returns empty array for empty inputs', () => {
    expect(extractUniqueLinks('')).toEqual([]);
    expect(extractUniqueLinks('   ')).toEqual([]);
  });
});

describe('isGoogleDriveUrl', () => {
  it('returns true for drive.google.com URLs', () => {
    expect(isGoogleDriveUrl('https://drive.google.com/file/d/1A2B3C/preview')).toBe(true);
    expect(isGoogleDriveUrl('http://drive.google.com/open?id=1A2B3C')).toBe(true);
    expect(isGoogleDriveUrl('drive.google.com/file/d/xyz')).toBe(true);
  });

  it('returns true for docs.google.com URLs', () => {
    expect(isGoogleDriveUrl('https://docs.google.com/presentation/d/123/edit')).toBe(true);
  });

  it('returns false for non-Google Drive URLs and invalid inputs', () => {
    expect(isGoogleDriveUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isGoogleDriveUrl('https://vimeo.com/123456789')).toBe(false);
    expect(isGoogleDriveUrl('https://attacker.com/drive.google.com')).toBe(false);
    expect(isGoogleDriveUrl('')).toBe(false);
    expect(isGoogleDriveUrl('not a url')).toBe(false);
  });
});

describe('getVideoMediaType', () => {
  it('detects Vimeo URLs from string input', () => {
    expect(getVideoMediaType('https://vimeo.com/123456789')).toBe('vimeo');
    expect(getVideoMediaType('https://player.vimeo.com/video/123456789?h=abcd1234')).toBe('vimeo');
    expect(getVideoMediaType('https://vimeo.com/groups/animation/videos/123456789')).toBe('vimeo');
  });

  it('detects YouTube URLs from string input', () => {
    expect(getVideoMediaType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(getVideoMediaType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(getVideoMediaType('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('youtube');
  });

  it('detects Google Drive URLs from string input', () => {
    expect(getVideoMediaType('https://drive.google.com/file/d/12345/preview')).toBe('google_drive');
  });

  it('falls back to generic for generic URLs or unrecognized inputs', () => {
    expect(getVideoMediaType('https://example.com/video.mp4')).toBe('generic');
    expect(getVideoMediaType('')).toBe('generic');
    expect(getVideoMediaType(null)).toBe('generic');
  });

  it('handles video objects with explicit types', () => {
    expect(getVideoMediaType({ type: 'upload', link: 's3://bucket/key.mp4' })).toBe('upload');
    expect(getVideoMediaType({ type: 'muse', metadata: { svid: 'muse-123' } })).toBe('muse');
    expect(getVideoMediaType({ type: 'google_drive', url: 'https://drive.google.com/file/d/1/preview' })).toBe(
      'google_drive'
    );
  });

  it('handles video objects from question-renderer with sourceUrl', () => {
    expect(getVideoMediaType({ sourceUrl: 'https://vimeo.com/76979871' })).toBe('vimeo');
    expect(getVideoMediaType({ sourceUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('youtube');
    expect(getVideoMediaType({ sourceUrl: 'https://drive.google.com/file/d/1/preview' })).toBe('google_drive');
    expect(getVideoMediaType({ sourceUrl: 'https://example.com/asset.webm' })).toBe('generic');
  });

  it('resolves generic object type using its URL', () => {
    expect(getVideoMediaType({ type: 'generic', url: 'https://vimeo.com/123456789' })).toBe('vimeo');
    expect(getVideoMediaType({ type: 'generic', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })).toBe('youtube');
  });

  it('getVideoType alias behaves identically to getVideoMediaType', () => {
    expect(getVideoType('https://vimeo.com/123456789')).toBe('vimeo');
  });
});
