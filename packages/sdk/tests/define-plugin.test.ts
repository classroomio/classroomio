import { describe, expect, it, vi } from 'vitest';
import { defineConfig, defineEntity, definePlugin, resolveConfig, type PluginDefinition } from '@cio/sdk';

const MockPageComponent = vi.fn();
const MockWidgetComponent = vi.fn();
const loadWidget = vi.fn(async () => ({ default: MockWidgetComponent as any }));

function validPlugin(overrides: Partial<PluginDefinition> = {}): PluginDefinition {
  return {
    id: 'block_test',
    name: 'Test Plugin',
    version: '1.0.0',
    category: 'block',
    description: 'A test plugin',
    ...overrides
  };
}

describe('definePlugin manifest validation', () => {
  it('returns a validated declarative manifest', () => {
    const plugin = definePlugin(validPlugin());

    expect(plugin).toMatchObject({
      id: 'block_test',
      name: 'Test Plugin',
      version: '1.0.0',
      category: 'block'
    });
  });

  it.each(['flashcards', 'Activity_flashcards', 'activity-flashcards', 'activity__flashcards', 'activity_flashcards_'])(
    'rejects invalid plugin id %s',
    (id) => {
      expect(() => definePlugin(validPlugin({ id }))).toThrow(/plugin id/i);
    }
  );

  it('rejects an unknown category', () => {
    const definition = validPlugin({ id: 'custom_test' });
    (definition as { category: string }).category = 'custom';

    expect(() => definePlugin(definition)).toThrow(/category/i);
  });

  it('rejects an id whose prefix does not match its category', () => {
    expect(() => definePlugin(validPlugin({ id: 'activity_test' }))).toThrow(/does not match/i);
  });

  it('accepts each of the six declared categories', () => {
    const categories = ['activity', 'block', 'integration', 'certificate', 'landing', 'enrollment'] as const;

    for (const category of categories) {
      expect(() => definePlugin(validPlugin({ id: `${category}_test`, category }))).not.toThrow();
    }
  });

  it.each(['1', 'v1.0.0', '1.0', '01.0.0'])('rejects invalid semver %s', (version) => {
    expect(() => definePlugin(validPlugin({ version }))).toThrow(/semver|version/i);
  });

  it.each(['name', 'description'] as const)('rejects a missing %s', (field) => {
    const definition = validPlugin() as Record<string, unknown>;
    delete definition[field];

    expect(() => definePlugin(definition as unknown as PluginDefinition)).toThrow(/manifest/i);
  });

  it('rejects undeclared hooks, slots, and permissions at runtime', () => {
    expect(() =>
      definePlugin({
        ...validPlugin(),
        on: { 'lesson.finished': vi.fn() }
      } as unknown as PluginDefinition)
    ).toThrow(/hook/i);

    expect(() =>
      definePlugin({
        ...validPlugin(),
        slots: { 'lesson.unknown': loadWidget }
      } as unknown as PluginDefinition)
    ).toThrow(/slot/i);

    expect(() =>
      definePlugin({
        ...validPlugin(),
        permissions: ['database:admin']
      } as unknown as PluginDefinition)
    ).toThrow(/permissions/i);
  });

  it('requires activities and entities to use their definition helpers', () => {
    expect(() =>
      definePlugin({
        ...validPlugin({ id: 'activity_test', category: 'activity' }),
        activities: [{ key: 'raw', label: 'Raw', renderers: {} }]
      } as unknown as PluginDefinition)
    ).toThrow(/defineActivityType/i);

    expect(() =>
      definePlugin({
        ...validPlugin(),
        entities: [{ name: 'raw', schema: { scope: ['org'], fields: {} } }]
      } as unknown as PluginDefinition)
    ).toThrow(/defineEntity/i);
  });
});

describe('resolveConfig plugin integration', () => {
  it('rejects a raw manifest that bypasses definePlugin', () => {
    expect(() => resolveConfig(defineConfig({ plugins: [validPlugin()] }))).toThrow(/definePlugin/i);
  });

  it('rejects duplicate plugin ids', () => {
    const first = definePlugin(validPlugin());
    const second = definePlugin(validPlugin({ name: 'Second Plugin' }));

    expect(() => resolveConfig(defineConfig({ plugins: [first, second] }))).toThrow(/more than once/i);
  });

  it('aggregates nav, routes, and lazy slot loaders', () => {
    const plugin = definePlugin({
      ...validPlugin(),
      nav: { add: [{ key: 'page-a', title: 'Page A', path: '/page-a' }] },
      routes: { '/page-a': MockPageComponent },
      slots: { 'lesson.sidebar': loadWidget }
    });
    const resolved = resolveConfig(defineConfig({ plugins: [plugin] }));

    expect(resolved.nav.add.map((item) => item.key)).toContain('page-a');
    expect(resolved.routes['/page-a']).toBe(MockPageComponent);
    expect(resolved.slots['lesson.sidebar']).toContain(loadWidget);
  });

  it('requires a privacy manifest when a plugin declares entities', () => {
    const points = defineEntity('xp_points', {
      scope: ['org', 'user'],
      fields: { points: { type: 'int', default: 0 } }
    });
    const plugin = definePlugin({
      ...validPlugin({ id: 'integration_xp', category: 'integration' }),
      entities: [points]
    });

    expect(() => resolveConfig(defineConfig({ plugins: [plugin] }))).toThrow(/privacy/i);
  });
});
