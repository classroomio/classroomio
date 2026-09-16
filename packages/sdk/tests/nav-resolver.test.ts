import { describe, expect, it } from 'vitest';
import { applyNavConfig } from '@cio/sdk';
import type { NavGroup } from '@cio/sdk';

const BASE_NAV: NavGroup[] = [
  {
    labelKey: 'nav.content',
    items: [
      { key: 'courses', title: 'Courses', path: '/courses' },
      { key: 'community', title: 'Community', path: '/community' },
      { key: 'tags', title: 'Tags', path: '/tags' }
    ]
  },
  {
    labelKey: 'nav.settings',
    items: [{ key: 'settings', title: 'Settings', path: '/settings' }]
  }
];

describe('applyNavConfig — remove', () => {
  it('removes items by key', () => {
    const result = applyNavConfig(BASE_NAV, { remove: ['community', 'tags'], rename: {}, add: [] });
    const allKeys = result.flatMap((g) => g.items.map((i) => i.key));
    expect(allKeys).not.toContain('community');
    expect(allKeys).not.toContain('tags');
  });

  it('preserves items not listed in remove', () => {
    const result = applyNavConfig(BASE_NAV, { remove: ['community'], rename: {}, add: [] });
    const allKeys = result.flatMap((g) => g.items.map((i) => i.key));
    expect(allKeys).toContain('courses');
    expect(allKeys).toContain('tags');
  });

  it('does not error when a remove key does not exist in nav', () => {
    expect(() => applyNavConfig(BASE_NAV, { remove: ['nonexistent'], rename: {}, add: [] })).not.toThrow();
  });

  it('removes all items from a group when all items are removed', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: ['courses', 'community', 'tags'],
      rename: {},
      add: []
    });
    const contentGroup = result.find((g) => g.labelKey === 'nav.content');
    expect(contentGroup?.items).toHaveLength(0);
  });
});

describe('applyNavConfig — rename', () => {
  it('renames an item title by key', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: [],
      rename: { courses: 'Modules' },
      add: []
    });
    const coursesItem = result.flatMap((g) => g.items).find((i) => i.key === 'courses');
    expect(coursesItem?.title).toBe('Modules');
  });

  it('does not rename items not listed in rename', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: [],
      rename: { courses: 'Modules' },
      add: []
    });
    const communityItem = result.flatMap((g) => g.items).find((i) => i.key === 'community');
    expect(communityItem?.title).toBe('Community');
  });

  it('does not error when a rename key does not exist in nav', () => {
    expect(() => applyNavConfig(BASE_NAV, { remove: [], rename: { nonexistent: 'Renamed' }, add: [] })).not.toThrow();
  });
});

describe('applyNavConfig — add', () => {
  it('appends new items to the end of the nav', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: [],
      rename: {},
      add: [{ key: 'renewals', title: 'Renewals', path: '/renewals', group: 'nav.content' }]
    });
    const allKeys = result.flatMap((g) => g.items.map((i) => i.key));
    expect(allKeys).toContain('renewals');
  });

  it('adds items into the specified group when it exists', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: [],
      rename: {},
      add: [{ key: 'renewals', title: 'Renewals', path: '/renewals', group: 'nav.content' }]
    });
    const contentGroup = result.find((g) => g.labelKey === 'nav.content');
    const renewals = contentGroup?.items.find((i) => i.key === 'renewals');
    expect(renewals).toBeDefined();
  });

  it('creates a new group when the specified group does not exist', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: [],
      rename: {},
      add: [{ key: 'renewals', title: 'Renewals', path: '/renewals', group: 'nav.custom' }]
    });
    const customGroup = result.find((g) => g.labelKey === 'nav.custom');
    expect(customGroup).toBeDefined();
    expect(customGroup?.items.find((i) => i.key === 'renewals')).toBeDefined();
  });
});

describe('applyNavConfig — composition', () => {
  it('applies remove, rename, and add in a single pass correctly', () => {
    const result = applyNavConfig(BASE_NAV, {
      remove: ['tags'],
      rename: { courses: 'Modules' },
      add: [{ key: 'renewals', title: 'Renewals', path: '/renewals', group: 'nav.content' }]
    });
    const allItems = result.flatMap((g) => g.items);
    const allKeys = allItems.map((i) => i.key);

    expect(allKeys).not.toContain('tags');
    expect(allItems.find((i) => i.key === 'courses')?.title).toBe('Modules');
    expect(allKeys).toContain('renewals');
  });

  it('returns a new array and does not mutate the original nav', () => {
    const original = JSON.parse(JSON.stringify(BASE_NAV));
    applyNavConfig(BASE_NAV, { remove: ['community'], rename: { courses: 'Modules' }, add: [] });
    expect(BASE_NAV).toStrictEqual(original);
  });
});
