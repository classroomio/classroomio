import { parseCspDomains } from './csp';

describe('parseCspDomains', () => {
  it('returns an empty list for missing or blank input', () => {
    expect(parseCspDomains(undefined)).toEqual([]);
    expect(parseCspDomains('')).toEqual([]);
    expect(parseCspDomains('   ')).toEqual([]);
    expect(parseCspDomains(', ,')).toEqual([]);
  });

  it('preserves special CSP source tokens and quoted self', () => {
    expect(parseCspDomains("data:, blob:, self, 'self'")).toEqual(['data:', 'blob:', "'self'", "'self'"]);
  });

  it('keeps explicit http(s) URLs and prefixes bare domains', () => {
    expect(parseCspDomains(' https://cdn.example.com , http://localhost:9000 , fonts.gstatic.com ')).toEqual([
      'https://cdn.example.com',
      'http://localhost:9000',
      'https://fonts.gstatic.com'
    ]);
  });
});
