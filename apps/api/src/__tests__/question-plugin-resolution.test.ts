import { describe, expect, it, vi } from 'vitest';
import { resolveQuestionPluginContext } from '@api/services/plugin/question-plugin';
import * as pluginQueries from '@cio/db/queries/plugin';

vi.mock('@cio/db/queries/plugin', () => ({
  getQuestionPluginResolutionData: vi.fn(),
  getInstallationGrants: vi.fn().mockResolvedValue([])
}));

describe('resolveQuestionPluginContext', () => {
  const envelope = {
    pluginId: 'com.classroomio.code-runner',
    installationId: 'inst-1',
    pluginVersion: '1.0.0',
    artifactDigest: 'sha256-correctdigest',
    contributionId: 'python-runner',
    configVersion: 1,
    publicConfig: { starter: 'print("hello")' }
  };

  const validPlugin: any = {
    id: 'com.classroomio.code-runner',
    name: 'Code Runner',
    status: 'published'
  };

  const validInstallation: any = {
    id: 'inst-1',
    pluginId: 'com.classroomio.code-runner',
    organizationId: 'org-1',
    status: 'active',
    orgApprovalStatus: 'approved',
    pluginVersionId: 'ver-1'
  };

  const validVersion: any = {
    id: 'ver-1',
    pluginId: 'com.classroomio.code-runner',
    version: '1.0.0',
    artifactDigest: 'sha256-correctdigest',
    reviewStatus: 'approved',
    manifest: {
      runtime: {
        ui: {
          entrypoints: {
            runner: {
              resource: 'dist/runner.html',
              renderMode: 'custom'
            }
          }
        }
      },
      contributes: {
        questionTypes: [
          {
            id: 'python-runner',
            title: 'Python Runner',
            entrypoints: {
              take: 'runner'
            }
          }
        ]
      }
    }
  };

  it('resolves active state for valid, pinned installation', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: validInstallation,
      installedVersion: validVersion,
      pinnedVersion: validVersion
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('active');
    expect(result.lifecycleState).toBe('active');
    expect(result.canTake).toBe(true);
    expect(result.canReview).toBe(true);
    expect(result.canEdit).toBe(true);
    expect(result.upgradeAvailable).toBe(false);
    expect(result.contribution?.title).toBe('Python Runner');
    expect(result.installationId).toBe('inst-1');
    expect(result.artifactUrl).toBe(
      'http://localhost:3002/plugins/assets/com.classroomio.code-runner/1.0.0/sha256-correctdigest/runner.html'
    );
  });

  it('flags upgradeAvailable when installation has a newer version', async () => {
    const newerVersion: any = {
      ...validVersion,
      id: 'ver-2',
      version: '1.1.0'
    };

    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: { ...validInstallation, pluginVersionId: 'ver-2' },
      installedVersion: newerVersion,
      pinnedVersion: validVersion
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('active');
    expect(result.upgradeAvailable).toBe(true);
    expect(result.installedVersion).toBe('1.1.0');
    expect(result.pinnedVersion).toBe('1.0.0');
  });

  it('resolves disabled state allowing review but blocking take/edit', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: { ...validInstallation, status: 'disabled' },
      installedVersion: validVersion,
      pinnedVersion: validVersion
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('disabled');
    expect(result.canTake).toBe(false);
    expect(result.canReview).toBe(true);
    expect(result.canEdit).toBe(false);
  });

  it('resolves uninstalled state when installation is missing or uninstalled', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: null,
      installedVersion: null,
      pinnedVersion: validVersion
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('uninstalled');
    expect(result.canTake).toBe(false);
    expect(result.canReview).toBe(true);
    expect(result.canEdit).toBe(false);
  });

  it('resolves revoked state when plugin is revoked', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: { ...validPlugin, status: 'revoked' },
      installation: validInstallation,
      installedVersion: validVersion,
      pinnedVersion: validVersion
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('revoked');
    expect(result.canTake).toBe(false);
    expect(result.canReview).toBe(false);
    expect(result.canEdit).toBe(false);
  });

  it('resolves unavailable state when artifact digest does not match', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: validInstallation,
      installedVersion: validVersion,
      pinnedVersion: { ...validVersion, artifactDigest: 'sha256-differenttampered' }
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('unavailable');
    expect(result.canTake).toBe(false);
    expect(result.reason).toContain('digest');
  });

  it('resolves unavailable state when contribution is missing from manifest', async () => {
    vi.mocked(pluginQueries.getQuestionPluginResolutionData).mockResolvedValueOnce({
      plugin: validPlugin,
      installation: validInstallation,
      installedVersion: validVersion,
      pinnedVersion: {
        ...validVersion,
        manifest: { contributes: { questionTypes: [] } }
      }
    });

    const result = await resolveQuestionPluginContext({
      organizationId: 'org-1',
      envelope
    });

    expect(result.state).toBe('unavailable');
    expect(result.canTake).toBe(false);
    expect(result.reason).toContain('Contribution');
  });
});
