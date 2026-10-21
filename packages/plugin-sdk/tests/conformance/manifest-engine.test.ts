import { describe, expect, it } from 'vitest';
import { validateManifest } from '../../bin/cio-plugin.mjs';

describe('Conformance: Manifest & Engine Compatibility', () => {
  const baseValidManifest = {
    manifestVersion: 1,
    id: 'com.example.reading-tracker',
    slug: 'reading-tracker',
    name: 'Reading Tracker',
    version: '1.2.3',
    description: 'Tracks reading time on lesson content',
    publisher: 'Reading Labs',
    engines: {
      classroomio: '^1.0.0',
      pluginApi: '^1.0.0'
    },
    permissions: {
      required: ['course.metadata:read', 'lesson.content:read'],
      optional: ['learner.progress:write']
    },
    dataPolicy: {
      storesCustomerData: false
    }
  };

  it('validates a compliant manifest with clean slug and permissions', () => {
    const result = validateManifest(baseValidManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects unsupported capabilities outside the security whitelist', () => {
    const manifest = {
      ...baseValidManifest,
      permissions: {
        required: ['admin.root:delete' as any]
      }
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unrecognized scope'))).toBe(true);
  });

  it('rejects path traversal in entrypoints or icon resources', () => {
    const manifest = {
      ...baseValidManifest,
      icon: { resource: '../secret/icon.svg' }
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('icon.resource must be a safe relative asset path'))).toBe(true);
  });

  it('enforces SemVer 2.0 version formatting', () => {
    const manifest = {
      ...baseValidManifest,
      version: 'v1.0'
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version must follow SemVer 2.0'))).toBe(true);
  });
});
