import { describe, expect, it } from 'vitest';
import {
  ZPluginManifest,
  isSensitiveScope,
  PLUGIN_PERMISSION_SCOPES,
  SENSITIVE_PLUGIN_SCOPES
} from '../src/validation/plugin';

describe('Plugin Manifest Schema (plugin.json v1)', () => {
  const validManifest = {
    manifestVersion: 1,
    id: 'com.classroomio.reading-time',
    name: 'Reading Time Estimator',
    version: '1.0.0',
    description: 'Displays estimated reading time for lesson articles.',
    publisher: 'classroomio',
    engines: {
      classroomio: '>=2.0.0 <3.0.0',
      pluginApi: '2026-10-08'
    },
    runtime: {
      ui: {
        entrypoints: {
          sidebarWidget: 'dist/ui/widget.html'
        }
      }
    },
    permissions: {
      required: ['lessons.metadata:read']
    },
    contributes: {
      slots: [
        {
          id: 'reading-time-sidebar',
          target: 'lesson.sidebar',
          entrypoint: 'sidebarWidget'
        }
      ]
    },
    dataPolicy: {
      storesCustomerData: false,
      retentionAfterUninstallDays: 30
    }
  };

  it('validates a compliant manifest successfully', () => {
    const result = ZPluginManifest.safeParse(validManifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('com.classroomio.reading-time');
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.permissions.required).toEqual(['lessons.metadata:read']);
    }
  });

  it('validates a complex remote app manifest with backend and network access', () => {
    const remoteAppManifest = {
      manifestVersion: 1,
      id: 'com.classroomio.certificate-studio',
      name: 'Certificate Studio',
      version: '2.1.0-beta.1',
      description: 'Design and manage custom organization certificates.',
      publisher: 'classroomio',
      engines: {
        classroomio: '>=2.0.0',
        pluginApi: '2026-10-08'
      },
      runtime: {
        ui: {
          entrypoints: {
            main: 'dist/ui/index.html',
            actionButton: 'dist/ui/button.html'
          }
        },
        backend: {
          type: 'remote',
          baseUrl: 'https://cert-studio.classroomio.com',
          webhookPath: '/webhooks/classroomio'
        }
      },
      permissions: {
        required: ['organization.profile:read', 'certificate_templates:read', 'certificate_templates:write'],
        optional: ['certificates.issued:read']
      },
      networkAccess: {
        allowedDomains: ['https://cert-studio.classroomio.com']
      },
      events: {
        subscriptions: ['organization.deleted']
      },
      contributes: {
        navigation: [
          {
            id: 'cert-studio-nav',
            title: 'Certificate Studio',
            location: 'organization.tools',
            page: 'cert-page'
          }
        ],
        pages: [
          {
            id: 'cert-page',
            entrypoint: 'main'
          }
        ],
        actions: [
          {
            id: 'cert-action',
            target: 'certificate.actions',
            entrypoint: 'actionButton'
          }
        ]
      },
      dataPolicy: {
        storesCustomerData: true,
        retentionAfterUninstallDays: 30,
        privacyPolicyUrl: 'https://classroomio.com/privacy'
      }
    };

    const result = ZPluginManifest.safeParse(remoteAppManifest);
    expect(result.success).toBe(true);
  });

  it('rejects manifest with non-SemVer version', () => {
    const invalid = {
      ...validManifest,
      version: 'v1.0.0'
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects manifest with non-reverse-domain id', () => {
    const invalid = {
      ...validManifest,
      id: 'reading_time_widget'
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects path traversal in entrypoints', () => {
    const invalid = {
      ...validManifest,
      runtime: {
        ui: {
          entrypoints: {
            sidebarWidget: '../etc/passwd'
          }
        }
      }
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects absolute paths in entrypoints', () => {
    const invalid = {
      ...validManifest,
      runtime: {
        ui: {
          entrypoints: {
            sidebarWidget: '/dist/ui/widget.html'
          }
        }
      }
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects contributes referencing undeclared entrypoints', () => {
    const invalid = {
      ...validManifest,
      contributes: {
        slots: [
          {
            id: 'reading-time-sidebar',
            target: 'lesson.sidebar',
            entrypoint: 'unregisteredEntrypoint'
          }
        ]
      }
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects storesCustomerData without privacyPolicyUrl', () => {
    const invalid = {
      ...validManifest,
      dataPolicy: {
        storesCustomerData: true,
        retentionAfterUninstallDays: 30
      }
    };
    const result = ZPluginManifest.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects manifest attempting to assert platform privilege (firstParty, official, trusted, builtin)', () => {
    const privilegedManifest = {
      ...validManifest,
      firstParty: true
    };
    const result = ZPluginManifest.safeParse(privilegedManifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/firstParty/);
    }

    const officialManifest = {
      ...validManifest,
      official: true
    };
    const officialResult = ZPluginManifest.safeParse(officialManifest);
    expect(officialResult.success).toBe(false);
  });

  it('correctly identifies sensitive permissions', () => {
    expect(isSensitiveScope('learners.profile:read')).toBe(true);
    expect(isSensitiveScope('courses:write')).toBe(true);
    expect(isSensitiveScope('organization.settings:read')).toBe(true);
    expect(isSensitiveScope('organization.profile:read')).toBe(false);
    expect(isSensitiveScope('lessons.metadata:read')).toBe(false);
  });

  it('all sensitive scopes are contained within main permissions list', () => {
    for (const scope of SENSITIVE_PLUGIN_SCOPES) {
      expect(PLUGIN_PERMISSION_SCOPES).toContain(scope);
    }
  });

  it('validates reading-time reference plugin manifest from disk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const manifestPath = path.resolve(__dirname, '../../../plugins/reading-time/plugin.json');
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const result = ZPluginManifest.safeParse(manifestContent);
    expect(result.success).toBe(true);
  });

  it('validates linkedin-certificate host-rendered action plugin manifest from disk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const manifestPath = path.resolve(__dirname, '../../../plugins/linkedin-certificate/plugin.json');
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const result = ZPluginManifest.safeParse(manifestContent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contributes.actions[0].renderMode).toBe('host');
      expect(result.data.contributes.actions[0].actionType).toBe('openUrl');
    }
  });

  it('validates lesson-acknowledgment plugin manifest from disk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const manifestPath = path.resolve(__dirname, '../../../plugins/lesson-acknowledgment/plugin.json');
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const result = ZPluginManifest.safeParse(manifestContent);
    expect(result.success).toBe(true);
  });

  it('validates announcement-banner plugin manifest from disk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const manifestPath = path.resolve(__dirname, '../../../plugins/announcement-banner/plugin.json');
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const result = ZPluginManifest.safeParse(manifestContent);
    expect(result.success).toBe(true);
  });

  it('validates object-based entrypoints with explicit renderMode and resource', () => {
    const manifestWithObjectEntrypoints = {
      ...validManifest,
      runtime: {
        ui: {
          entrypoints: {
            sidebarWidget: {
              renderMode: 'custom',
              resource: 'dist/ui/widget.html'
            }
          }
        }
      }
    };
    const result = ZPluginManifest.safeParse(manifestWithObjectEntrypoints);
    expect(result.success).toBe(true);
  });

  it('validates a headless plugin without runtime or UI', () => {
    const headlessManifest = {
      manifestVersion: 1,
      id: 'com.classroomio.webhook-sync',
      name: 'Webhook Event Forwarder',
      version: '1.0.0',
      description: 'Headless plugin that subscribes to course events and forwards to external webhook.',
      publisher: 'classroomio',
      engines: {
        classroomio: '>=2.0.0',
        pluginApi: '2026-10-08'
      },
      events: {
        subscriptions: ['course.completed.v1']
      },
      permissions: {
        required: ['courses.metadata:read']
      },
      dataPolicy: {
        storesCustomerData: false,
        retentionAfterUninstallDays: 30
      }
    };
    const result = ZPluginManifest.safeParse(headlessManifest);
    expect(result.success).toBe(true);
  });

  it('validates host-rendered declarative slot without entrypoint', () => {
    const hostSlotManifest = {
      ...validManifest,
      contributes: {
        slots: [
          {
            id: 'reading-time-host-badge',
            target: 'lesson.after',
            renderMode: 'host',
            title: 'Reading Time'
          }
        ]
      }
    };
    const result = ZPluginManifest.safeParse(hostSlotManifest);
    expect(result.success).toBe(true);
  });

  it('rejects unknown top-level fields (fails closed)', () => {
    const invalidManifest = {
      ...validManifest,
      unknownField: 'unsupported'
    };
    const result = ZPluginManifest.safeParse(invalidManifest);
    expect(result.success).toBe(false);
  });

  it('accepts custom metadata under extensions namespace', () => {
    const manifestWithExtensions = {
      ...validManifest,
      extensions: {
        'com.example.custom': { key: 'value', count: 42 }
      }
    };
    const result = ZPluginManifest.safeParse(manifestWithExtensions);
    expect(result.success).toBe(true);
  });
});
