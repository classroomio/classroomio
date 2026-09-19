import { describe, expect, it } from 'vitest';
import { defineConfig, resolveConfig } from '@cio/sdk';

// ─── defineConfig: shape validation ────────────────────────────────────────

describe('defineConfig', () => {
  it('returns the config object unchanged', () => {
    const input = {
      theme: { primary: '#0F62FE', radius: 'sm' as const, font: 'Geist' }
    };
    expect(defineConfig(input)).toStrictEqual(input);
  });

  it('accepts an empty config', () => {
    expect(() => defineConfig({})).not.toThrow();
  });

  it('accepts a full config with all top-level keys', () => {
    expect(() =>
      defineConfig({
        theme: { primary: '#FF0000', radius: 'md', font: 'Inter' },
        nav: { remove: ['community'], rename: { courses: 'Modules' }, add: [] },
        terminology: { course: 'Module', student: 'Trainee' },
        plugins: []
      })
    ).not.toThrow();
  });
});

// ─── resolveConfig: defaults ────────────────────────────────────────────────

describe('resolveConfig — defaults', () => {
  it('fills missing theme fields with defaults', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.theme).toMatchObject({
      primary: expect.any(String),
      radius: expect.any(String),
      font: expect.any(String)
    });
  });

  it('defaults plugins to an empty array', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.plugins).toEqual([]);
  });

  it('defaults nav remove/rename/add to empty structures', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.nav.remove).toEqual([]);
    expect(resolved.nav.rename).toEqual({});
    expect(resolved.nav.add).toEqual([]);
  });

  it('defaults terminology to an empty object', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.terminology).toEqual({});
  });
});
