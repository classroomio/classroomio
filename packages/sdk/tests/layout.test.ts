import { describe, expect, it } from 'vitest';
import { sidebar } from '@cio/sdk/layouts';
import { resolveConfig, defineConfig } from '@cio/sdk';

describe('layout factories', () => {
  it('sidebar() returns a layout definition with key "sidebar"', () => {
    expect(sidebar().key).toBe('sidebar');
  });

  it('exposes a shell component reference', () => {
    expect(sidebar().shell).toBeDefined();
  });
});

describe('resolveConfig — layout resolution', () => {
  it('resolves to the sidebar layout when none is specified (default)', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.layout.key).toBe('sidebar');
  });

  it('resolves to the sidebar layout when sidebar() is explicitly configured', () => {
    const resolved = resolveConfig(defineConfig({ layout: sidebar() }));
    expect(resolved.layout.key).toBe('sidebar');
  });
});
