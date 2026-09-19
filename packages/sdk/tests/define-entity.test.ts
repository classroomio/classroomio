import { describe, expect, it } from 'vitest';
import { defineEntity, definePlugin, resolveConfig, defineConfig } from '@cio/sdk';

describe('defineEntity — factory & schema validation', () => {
  it('creates an entity definition with name, scope, and fields', () => {
    const xpEntity = defineEntity('xp_points', {
      scope: ['org', 'user'],
      fields: {
        points: { type: 'int', default: 0 },
        reason: { type: 'text' }
      }
    });

    expect(xpEntity.name).toBe('xp_points');
    expect(xpEntity.schema.scope).toEqual(['org', 'user']);
    expect(xpEntity.schema.fields.points.type).toBe('int');
    expect(xpEntity.schema.fields.points.default).toBe(0);
    expect(xpEntity.schema.fields.reason.type).toBe('text');
  });

  it('enforces that "org" must be present in scope', () => {
    expect(() => {
      defineEntity('invalid_scope_entity', {
        // @ts-expect-error test invalid scope without org
        scope: ['user'],
        fields: {
          score: { type: 'int' }
        }
      });
    }).toThrow(/org/i);
  });

  it('validates supported field types', () => {
    const validEntity = defineEntity('valid_types', {
      scope: ['org'],
      fields: {
        aText: { type: 'text' },
        anInt: { type: 'int' },
        aFloat: { type: 'float' },
        aBool: { type: 'boolean' },
        aTime: { type: 'timestamp' },
        aJson: { type: 'json' }
      }
    });

    expect(validEntity.schema.fields.aText.type).toBe('text');
    expect(validEntity.schema.fields.aJson.type).toBe('json');
  });

  it('throws when an invalid field type is provided', () => {
    expect(() => {
      defineEntity('bad_field_type', {
        scope: ['org'],
        fields: {
          // @ts-expect-error invalid type
          badField: { type: 'invalid_type' }
        }
      });
    }).toThrow(/field type/i);
  });

  it('rejects empty or invalid entity names', () => {
    expect(() => {
      defineEntity('', {
        scope: ['org'],
        fields: { count: { type: 'int' } }
      });
    }).toThrow(/name/i);

    expect(() => {
      defineEntity('invalid name with spaces!', {
        scope: ['org'],
        fields: { count: { type: 'int' } }
      });
    }).toThrow(/name/i);
  });
});

describe('defineEntity — plugin and config integration', () => {
  it('registers entities in definePlugin and aggregates in resolveConfig', () => {
    const xpEntity = defineEntity('xp_points', {
      scope: ['org', 'user'],
      fields: { points: { type: 'int', default: 0 } }
    });

    const badgeEntity = defineEntity('badges', {
      scope: ['org', 'user'],
      fields: { badgeId: { type: 'text' } }
    });

    const pluginA = definePlugin({
      id: 'integration_xp_plugin',
      name: 'XP Plugin',
      version: '1.0.0',
      category: 'integration',
      description: 'Awards XP points',
      entities: [xpEntity],
      privacy: {
        description: 'Stores XP points per user',
        storesPersonalData: true,
        onDeleteUser: async () => {},
        onExportUser: async () => ({})
      }
    });

    const pluginB = definePlugin({
      id: 'integration_badge_plugin',
      name: 'Badge Plugin',
      version: '1.0.0',
      category: 'integration',
      description: 'Awards badges',
      entities: [badgeEntity],
      privacy: {
        description: 'Stores badge awards per user',
        storesPersonalData: true,
        onDeleteUser: async () => {},
        onExportUser: async () => ({})
      }
    });

    const resolved = resolveConfig(
      defineConfig({
        plugins: [pluginA, pluginB]
      })
    );

    expect(resolved.entities).toBeDefined();
    expect(resolved.entities['xp_points']).toBeDefined();
    expect(resolved.entities['xp_points'].name).toBe('xp_points');
    expect(resolved.entities['badges']).toBeDefined();
    expect(resolved.entities['badges'].name).toBe('badges');
  });

  it('throws on duplicate entity name collision between plugins', () => {
    const entity1 = defineEntity('collision_entity', {
      scope: ['org'],
      fields: { f1: { type: 'text' } }
    });
    const entity2 = defineEntity('collision_entity', {
      scope: ['org'],
      fields: { f2: { type: 'int' } }
    });

    const pluginA = definePlugin({
      id: 'integration_plugin_a',
      name: 'Plugin A',
      version: '1.0.0',
      category: 'integration',
      description: 'Plugin A',
      entities: [entity1],
      privacy: {
        description: 'Stores collision entity data',
        storesPersonalData: false,
        onDeleteUser: async () => {},
        onExportUser: async () => ({})
      }
    });

    const pluginB = definePlugin({
      id: 'integration_plugin_b',
      name: 'Plugin B',
      version: '1.0.0',
      category: 'integration',
      description: 'Plugin B',
      entities: [entity2],
      privacy: {
        description: 'Stores collision entity data',
        storesPersonalData: false,
        onDeleteUser: async () => {},
        onExportUser: async () => ({})
      }
    });

    expect(() => {
      resolveConfig(
        defineConfig({
          plugins: [pluginA, pluginB]
        })
      );
    }).toThrow(/collision_entity/i);
  });
});
