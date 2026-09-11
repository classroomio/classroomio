import { describe, expect, it } from 'vitest';
import {
  adaptDevWidgetEmbedCode,
  adaptDevWidgetUrl,
  getEmbedBaseUrl,
  getEmbedPublicUrl
} from '../src/constants/embeds';

describe('embed constants and URLs', () => {
  it('returns default embed public base URL when override is not provided', () => {
    expect(getEmbedBaseUrl()).toBe('https://embed.classroomio.com');
  });

  it('constructs public URLs for widgets with search params', () => {
    const url = getEmbedPublicUrl('course-widget', { key: 'wgt_123', view: 'grid' });
    expect(url).toBe('https://embed.classroomio.com/course-widget?key=wgt_123&view=grid');
  });
});

describe('adaptDevWidgetUrl', () => {
  it('returns original url if location is not provided', () => {
    const url = 'http://localhost:5180/course-widget?key=abc';
    expect(adaptDevWidgetUrl(url)).toBe(url);
  });

  it('preserves localhost url when browser is on localhost with http', () => {
    const url = 'http://localhost:5180/course-widget?key=abc';
    expect(adaptDevWidgetUrl(url, { hostname: 'localhost', protocol: 'http:' })).toBe(url);
  });

  it('upgrades localhost to https if browser is on https', () => {
    const url = 'http://localhost:5180/course-widget?key=abc';
    expect(adaptDevWidgetUrl(url, { hostname: 'localhost', protocol: 'https:' })).toBe(
      'https://localhost:5180/course-widget?key=abc'
    );
  });

  it('adapts localhost to LAN IP with browser protocol', () => {
    const url = 'http://localhost:5180/course-widget?key=abc';
    expect(adaptDevWidgetUrl(url, { hostname: '192.168.1.50', protocol: 'https:' })).toBe(
      'https://192.168.1.50:5180/course-widget?key=abc'
    );
    expect(adaptDevWidgetUrl(url, { hostname: '192.168.1.50', protocol: 'http:' })).toBe(
      'http://192.168.1.50:5180/course-widget?key=abc'
    );
  });

  it('does not touch production CDN URLs', () => {
    const cdnUrl = 'https://embed.classroomio.com/course-widget?key=abc';
    expect(adaptDevWidgetUrl(cdnUrl, { hostname: '192.168.1.50', protocol: 'https:' })).toBe(cdnUrl);
  });
});

describe('adaptDevWidgetEmbedCode', () => {
  const code =
    '<div data-cio-widget="course-widget" data-widget-key="wgt_123"></div>\n<script async type="module" src="http://localhost:5180/embeds/course-widget/course-widget.js"></script>';

  it('returns original embed code if location is not provided', () => {
    expect(adaptDevWidgetEmbedCode(code)).toBe(code);
  });

  it('adapts localhost script URL to LAN IP with https', () => {
    const adapted = adaptDevWidgetEmbedCode(code, { hostname: '192.168.1.50', protocol: 'https:' });
    expect(adapted).toContain('src="https://192.168.1.50:5180/embeds/course-widget/course-widget.js"');
  });

  it('upgrades script URL to https on localhost if on https', () => {
    const adapted = adaptDevWidgetEmbedCode(code, { hostname: 'localhost', protocol: 'https:' });
    expect(adapted).toContain('src="https://localhost:5180/embeds/course-widget/course-widget.js"');
  });
});
