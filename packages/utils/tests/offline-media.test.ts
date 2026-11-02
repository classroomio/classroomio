import { describe, expect, it } from 'vitest';

import {
  lessonHtmlImageUrls,
  offlineImageKey,
  offlineMediaKey,
  replaceLessonHtmlImages
} from '../src/functions/offline-media';

describe('offlineMediaKey', () => {
  it('prefers the asset id, then the storage key, then the link', () => {
    expect(offlineMediaKey({ assetId: 'a1', key: 'k1', link: 'https://x.test/a' })).toBe('asset:a1');
    expect(offlineMediaKey({ assetId: null, key: 'k1', link: 'https://x.test/a?sig=1' })).toBe('key:k1');
    expect(offlineMediaKey({ link: 'https://x.test/a' })).toBe('url:https://x.test/a');
  });

  it('stays the same when only the presigned link changes', () => {
    const first = offlineMediaKey({ key: 'docs/file.pdf', link: 'https://s3.test/docs/file.pdf?X-Amz-Signature=1' });
    const second = offlineMediaKey({ key: 'docs/file.pdf', link: 'https://s3.test/docs/file.pdf?X-Amz-Signature=2' });

    expect(first).toBe(second);
  });
});

describe('lesson HTML images', () => {
  const html =
    '<p><img src="https://cdn.test/a.png" alt="A"></p><img alt=\'B\' src=\'https://cdn.test/b.jpg?w=1&amp;h=2\'>' +
    '<img src="/relative.png"><img src="data:image/png;base64,AAAA"><img src="https://cdn.test/a.png">';

  it('lists absolute image URLs once, in order, decoding attribute entities', () => {
    expect(lessonHtmlImageUrls(html)).toEqual(['https://cdn.test/a.png', 'https://cdn.test/b.jpg?w=1&h=2']);
    expect(lessonHtmlImageUrls(null)).toEqual([]);
  });

  it('replaces only the images it has local copies for', () => {
    const local = new Map([['https://cdn.test/b.jpg?w=1&h=2', 'data:image/jpeg;base64,BBBB']]);
    const result = replaceLessonHtmlImages(html, local);

    expect(result).toContain("src='data:image/jpeg;base64,BBBB'");
    expect(result).toContain('src="https://cdn.test/a.png"');
    expect(result).toContain('src="/relative.png"');
  });

  it('keys images by URL', () => {
    expect(offlineImageKey('https://cdn.test/a.png')).toBe('image:https://cdn.test/a.png');
  });
});
