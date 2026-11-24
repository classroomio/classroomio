import { describe, expect, it } from 'vitest';

import { inScope, sourceScope } from './scope';

describe('source scope', () => {
  it('accepts the root itself and every path under it', () => {
    const scope = sourceScope('https://acme.com/docs', {});

    expect(inScope('https://acme.com/docs', scope)).toBe(true);
    expect(inScope('https://acme.com/docs/', scope)).toBe(true);
    expect(inScope('https://acme.com/docs/getting-started/install', scope)).toBe(true);
  });

  it('does not let a prefix match a longer sibling path', () => {
    const scope = sourceScope('https://acme.com/docs', {});

    expect(inScope('https://acme.com/docs-old/install', scope)).toBe(false);
    expect(inScope('https://acme.com/docsets', scope)).toBe(false);
    expect(inScope('https://acme.com/guide/docs', scope)).toBe(false);
  });

  it('keeps every path of a host-rooted source in scope', () => {
    const scope = sourceScope('https://help.acme.com/', {});

    expect(inScope('https://help.acme.com/', scope)).toBe(true);
    expect(inScope('https://help.acme.com/articles/billing', scope)).toBe(true);
    expect(inScope('https://acme.com/articles/billing', scope)).toBe(false);
  });

  it('accepts hosts the source redirected to only once they are recorded', () => {
    const scope = sourceScope('https://help.acme.com/', {});
    const redirected = 'https://docs.acme.com/article/one';

    expect(inScope(redirected, scope)).toBe(false);

    scope.extraHosts.add('docs.acme.com');

    expect(inScope(redirected, scope)).toBe(true);
    expect(inScope('https://other.com/article/one', scope)).toBe(false);
  });

  it('restricts reading to include patterns when they are given', () => {
    const scope = sourceScope('https://acme.com/docs', { include: ['https://acme.com/docs/en/*'] });

    expect(inScope('https://acme.com/docs/en/start', scope)).toBe(true);
    expect(inScope('https://acme.com/docs/fr/start', scope)).toBe(false);
  });

  it('rejects an excluded URL even when it matches an include pattern', () => {
    const scope = sourceScope('https://acme.com/docs', {
      include: ['https://acme.com/docs/*'],
      exclude: ['https://acme.com/docs/release-notes*']
    });

    expect(inScope('https://acme.com/docs/set-up', scope)).toBe(true);
    expect(inScope('https://acme.com/docs/release-notes-2026', scope)).toBe(false);
  });

  it('lets a single star span path segments and query strings', () => {
    const scope = sourceScope('https://acme.com/docs', { exclude: ['https://acme.com/docs/*/print*'] });

    expect(inScope('https://acme.com/docs/start/print', scope)).toBe(false);
    expect(inScope('https://acme.com/docs/start/print?view=full', scope)).toBe(false);
    expect(inScope('https://acme.com/docs/start/setup', scope)).toBe(true);
  });

  it('matches patterns without regard to case', () => {
    const scope = sourceScope('https://acme.com/docs', { exclude: ['https://acme.com/docs/Release-Notes*'] });

    expect(inScope('https://acme.com/docs/release-notes', scope)).toBe(false);
  });

  it('treats question marks in a pattern as literal URL characters', () => {
    const scope = sourceScope('https://acme.com/docs', { exclude: ['https://acme.com/docs?lang=fr'] });

    expect(inScope('https://acme.com/docs?lang=fr', scope)).toBe(false);
    expect(inScope('https://acme.com/docs?lang=en', scope)).toBe(true);
  });

  it('does not treat dots in a pattern as wildcards', () => {
    const scope = sourceScope('https://acme.com/docs', { exclude: ['https://acme.com/docs/a.b'] });

    expect(inScope('https://acme.com/docs/a.b', scope)).toBe(false);
    expect(inScope('https://acme.com/docs/axb', scope)).toBe(true);
  });

  it('treats a root with a trailing slash the same as one without', () => {
    const scope = sourceScope('https://acme.com/docs/', {});

    expect(inScope('https://acme.com/docs', scope)).toBe(true);
    expect(inScope('https://acme.com/docs/start', scope)).toBe(true);
    expect(inScope('https://acme.com/docs-old', scope)).toBe(false);
  });

  it('rejects malformed and non-web URLs instead of throwing', () => {
    const scope = sourceScope('https://acme.com/', {});

    expect(inScope('not a url', scope)).toBe(false);
    expect(inScope('mailto:help@acme.com', scope)).toBe(false);
    expect(inScope('javascript:alert(1)', scope)).toBe(false);
  });
});
