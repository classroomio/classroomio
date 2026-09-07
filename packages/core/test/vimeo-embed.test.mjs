import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractVimeoDetails,
  isValidVimeoUrl,
  toCanonicalVimeoUrl,
  formatVimeoEmbedUrl
} from '../../utils/dist/index.js';

test('Vimeo URL Parsing - standard video URLs', () => {
  const result = extractVimeoDetails('https://vimeo.com/123456789');
  assert.deepEqual(result, { videoId: '123456789' });
  assert.equal(isValidVimeoUrl('https://vimeo.com/123456789'), true);
  assert.equal(toCanonicalVimeoUrl('https://vimeo.com/123456789'), 'https://vimeo.com/123456789');
  assert.equal(formatVimeoEmbedUrl('https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789');
});

test('Vimeo URL Parsing - URL without protocol', () => {
  const result = extractVimeoDetails('vimeo.com/987654321');
  assert.deepEqual(result, { videoId: '987654321' });
  assert.equal(toCanonicalVimeoUrl('vimeo.com/987654321'), 'https://vimeo.com/987654321');
});

test('Vimeo URL Parsing - unlisted video with privacy hash in path', () => {
  const url = 'https://vimeo.com/76979871/d55f0535a3';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '76979871', hash: 'd55f0535a3' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/76979871/d55f0535a3');
  assert.equal(formatVimeoEmbedUrl(url), 'https://player.vimeo.com/video/76979871?h=d55f0535a3');
});

test('Vimeo URL Parsing - unlisted video with privacy hash in query param', () => {
  const url = 'https://vimeo.com/76979871?h=d55f0535a3';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '76979871', hash: 'd55f0535a3' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/76979871/d55f0535a3');
  assert.equal(formatVimeoEmbedUrl(url), 'https://player.vimeo.com/video/76979871?h=d55f0535a3');
});

test('Vimeo URL Parsing - channel URL', () => {
  const url = 'https://vimeo.com/channels/staffpicks/59777392';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '59777392' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/59777392');
  assert.equal(formatVimeoEmbedUrl(url), 'https://player.vimeo.com/video/59777392');
});

test('Vimeo URL Parsing - showcase / album URL', () => {
  const url = 'https://vimeo.com/showcase/12345/video/987654';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '987654' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/987654');
});

test('Vimeo URL Parsing - group URL', () => {
  const url = 'https://vimeo.com/groups/animation/videos/123456789';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '123456789' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/123456789');
  assert.equal(formatVimeoEmbedUrl(url), 'https://player.vimeo.com/video/123456789');
});

test('Vimeo URL Parsing - case-insensitive HTTP schemes', () => {
  const url = 'HTTPS://VIMEO.COM/123456789';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '123456789' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/123456789');
});

test('Vimeo URL Parsing - player.vimeo.com embed URL', () => {
  const url = 'https://player.vimeo.com/video/123456789?h=abcdef1234';
  const result = extractVimeoDetails(url);
  assert.deepEqual(result, { videoId: '123456789', hash: 'abcdef1234' });
  assert.equal(toCanonicalVimeoUrl(url), 'https://vimeo.com/123456789/abcdef1234');
  assert.equal(formatVimeoEmbedUrl(url), 'https://player.vimeo.com/video/123456789?h=abcdef1234');
});

test('Security Invariant - rejects lookalike hosts and malicious payloads', () => {
  // Lookalike hosts
  assert.equal(extractVimeoDetails('https://vimeo.com.attacker.com/12345'), null);
  assert.equal(extractVimeoDetails('https://attacker.com/vimeo.com/12345'), null);
  assert.equal(extractVimeoDetails('https://notvimeo.com/12345'), null);
  assert.equal(extractVimeoDetails('https://fakevimeo.com/12345'), null);

  // Userinfo tricks
  assert.equal(extractVimeoDetails('https://vimeo.com@attacker.com/12345'), null);

  // Non-numeric video IDs
  assert.equal(extractVimeoDetails('https://vimeo.com/not-a-number'), null);
  assert.equal(extractVimeoDetails('https://vimeo.com/123abc456'), null);
  assert.equal(extractVimeoDetails('https://vimeo.com/123/../../etc/passwd'), null);

  // Invalid hash
  assert.equal(extractVimeoDetails('https://vimeo.com/123456?h=<script>'), null);
});

test('Security Invariant - canonical and embed URLs strictly reconstruct and drop injection query params', () => {
  const dirtyUrl = 'https://vimeo.com/123456789?malicious=payload&foo=bar#extra';
  const canonical = toCanonicalVimeoUrl(dirtyUrl);
  const embed = formatVimeoEmbedUrl(dirtyUrl);

  assert.equal(canonical, 'https://vimeo.com/123456789');
  assert.equal(embed, 'https://player.vimeo.com/video/123456789');
  assert.equal(canonical.includes('malicious'), false);
  assert.equal(embed.includes('malicious'), false);
});

test('Edge cases - empty, whitespace, and non-Vimeo strings', () => {
  assert.equal(extractVimeoDetails(''), null);
  assert.equal(extractVimeoDetails('   '), null);
  assert.equal(extractVimeoDetails('https://youtube.com/watch?v=12345'), null);
  assert.equal(isValidVimeoUrl(''), false);
  assert.equal(isValidVimeoUrl('https://google.com'), false);
  assert.equal(toCanonicalVimeoUrl(''), null);
  assert.equal(formatVimeoEmbedUrl(''), '');
});
