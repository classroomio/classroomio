import { describe, expect, it } from 'vitest';
import { buildPlaylistUrl, parseYoutubePlaylistId } from '@cio/core/services/youtube-playlist/parse-playlist-id';

describe('parseYoutubePlaylistId', () => {
  it('extracts the id from a canonical playlist URL', () => {
    expect(parseYoutubePlaylistId('https://www.youtube.com/playlist?list=PLabc123DEF456')).toBe('PLabc123DEF456');
  });

  it('extracts the id from a watch URL that carries a list param', () => {
    expect(parseYoutubePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123DEF456')).toBe(
      'PLabc123DEF456'
    );
  });

  it.each([
    'https://m.youtube.com/playlist?list=PLabc123DEF456',
    'https://music.youtube.com/playlist?list=PLabc123DEF456',
    'https://youtu.be/dQw4w9WgXcQ?list=PLabc123DEF456',
    'www.youtube.com/playlist?list=PLabc123DEF456'
  ])('accepts allowlisted host variant %s', (url) => {
    expect(parseYoutubePlaylistId(url)).toBe('PLabc123DEF456');
  });

  it('accepts a bare playlist id', () => {
    expect(parseYoutubePlaylistId('PLabc123DEF456')).toBe('PLabc123DEF456');
  });

  it.each(['LL', 'WL', 'll', 'wl'])('rejects the private per-account playlist %s', (id) => {
    expect(parseYoutubePlaylistId(id)).toBeNull();
    expect(parseYoutubePlaylistId(`https://www.youtube.com/playlist?list=${id}`)).toBeNull();
  });

  it.each([
    'https://evil.example.com/playlist?list=PLabc123DEF456',
    'https://youtube.com.evil.example/playlist?list=PLabc123DEF456',
    'http://127.0.0.1/playlist?list=PLabc123DEF456',
    'http://localhost:8080/playlist?list=PLabc123DEF456',
    'http://169.254.169.254/playlist?list=PLabc123DEF456'
  ])('rejects non-YouTube host %s', (url) => {
    expect(parseYoutubePlaylistId(url)).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'data:text/html,<script>alert(1)</script>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/playlist?list=has spaces',
    'https://www.youtube.com/playlist?list=',
    '',
    '   '
  ])('rejects %s', (value) => {
    expect(parseYoutubePlaylistId(value)).toBeNull();
  });

  it('rebuilds a canonical URL from the parsed id, discarding the caller string', () => {
    const id = parseYoutubePlaylistId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123DEF456&index=7');

    expect(id).toBe('PLabc123DEF456');
    expect(buildPlaylistUrl(id!)).toBe('https://www.youtube.com/playlist?list=PLabc123DEF456');
  });
});
