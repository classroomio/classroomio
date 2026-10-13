import { describe, expect, it } from 'vitest';
import { resolvePluginActionUrl } from './plugin-actions';

describe('resolvePluginActionUrl', () => {
  it('interpolates and encodes action context into an HTTPS URL', () => {
    const url = resolvePluginActionUrl(
      'https://example.com/share?title={courseTitle}',
      {
        courseTitle: 'Design & Delivery'
      },
      ['https://example.com']
    );

    expect(url).toBe('https://example.com/share?title=Design%20%26%20Delivery');
  });

  it('allows a static HTTPS URL', () => {
    const url = resolvePluginActionUrl('https://social.example.com/share', {}, ['https://social.example.com']);

    expect(url).toBe('https://social.example.com/share');
  });

  it.each(['javascript:alert(1)', 'data:text/html,unsafe', 'http://example.com'])(
    'rejects unsafe URL %s',
    (template) => {
      expect(resolvePluginActionUrl(template, {}, ['https://example.com'])).toBeNull();
    }
  );

  it('rejects an HTTPS destination that was not declared by the plugin', () => {
    expect(resolvePluginActionUrl('https://undeclared.example/path', {}, ['https://example.com'])).toBeNull();
  });
});
