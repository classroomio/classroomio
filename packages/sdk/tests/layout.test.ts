import { describe, expect, it } from 'vitest';
import { sidebar, topNav } from '@cio/sdk/layouts';
import { resolveConfig, defineConfig } from '@cio/sdk';

describe('layout factories', () => {
  it('sidebar() returns a layout definition with key "sidebar"', () => {
    expect(sidebar().key).toBe('sidebar');
  });

  it('topNav() returns a layout definition with key "top-nav"', () => {
    expect(topNav().key).toBe('top-nav');
  });

  it('sidebar() and topNav() return different layout definitions', () => {
    expect(sidebar().key).not.toBe(topNav().key);
  });

  it('each layout definition exposes a shell component reference', () => {
    expect(sidebar().shell).toBeDefined();
    expect(topNav().shell).toBeDefined();
    expect(sidebar().shell).not.toBe(topNav().shell);
  });
});

describe('resolveConfig — layout resolution', () => {
  it('resolves to the sidebar layout when none is specified (default)', () => {
    const resolved = resolveConfig(defineConfig({}));
    expect(resolved.layout.key).toBe('sidebar');
  });

  it('resolves to the topNav layout when topNav() is configured', () => {
    const resolved = resolveConfig(defineConfig({ layout: topNav() }));
    expect(resolved.layout.key).toBe('top-nav');
  });

  it('resolves to the sidebar layout when sidebar() is explicitly configured', () => {
    const resolved = resolveConfig(defineConfig({ layout: sidebar() }));
    expect(resolved.layout.key).toBe('sidebar');
  });

  it('exposes the correct shell component for each layout', () => {
    const resolvedSidebar = resolveConfig(defineConfig({ layout: sidebar() }));
    const resolvedTopNav = resolveConfig(defineConfig({ layout: topNav() }));
    expect(resolvedSidebar.layout.shell).not.toBe(resolvedTopNav.layout.shell);
  });
});
