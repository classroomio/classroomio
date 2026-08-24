import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/config/env', () => ({
  env: {}
}));

vi.mock('@cio/db/queries/widget', () => ({
  archiveWidget: vi.fn(),
  createWidget: vi.fn(),
  createWidgetVersion: vi.fn(),
  getWidgetListItemById: vi.fn(),
  getNextWidgetVersion: vi.fn(),
  getPublishedWidgetPayloadByPublicKey: vi.fn(),
  getWidgetById: vi.fn(),
  getWidgetVersionById: vi.fn(),
  listWidgetCourses: vi.fn(),
  listWidgetVersions: vi.fn(),
  listWidgetsByOrganization: vi.fn(),
  replaceWidgetCourses: vi.fn(),
  updateWidget: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn()
}));

vi.mock('@api/services/widget-payload', () => ({
  buildWidgetPayload: vi.fn(),
  generateWidgetPublicKey: vi.fn(),
  getCourseBaseUrl: vi.fn(),
  getCourseWidgetScriptUrl: vi.fn(),
  getWidgetEmbedCode: vi.fn(),
  getWidgetHostedEmbedUrl: vi.fn(),
  listWidgetAvailableEditorData: vi.fn()
}));

import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import {
  createWidgetVersion,
  getNextWidgetVersion,
  getWidgetById,
  getWidgetVersionById,
  updateWidget
} from '@cio/db/queries/widget';
import { PLAN } from '@cio/utils/plans';
import { getDefaultWidgetConfig, ZWidgetPayload } from '@cio/utils/validation/widget';
import { rollbackOrganizationWidget } from '@api/services/widget';

describe('rollbackOrganizationWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores the target version layout, selection mode, and config onto the live widget row', async () => {
    const defaultWidgetConfig = getDefaultWidgetConfig();
    const targetVersionConfig = { ...defaultWidgetConfig, themePreset: 'graphite' as const };
    const WIDGET_UUID = '11111111-1111-4111-8111-111111111111';
    const ORG_UUID = '22222222-2222-4222-8222-222222222222';

    const targetPayload = ZWidgetPayload.parse({
      version: 'v1',
      widgetId: WIDGET_UUID,
      publicKey: 'wgt_test',
      organization: { id: ORG_UUID, name: 'Org', siteName: 'org' },
      layoutType: 'carousel',
      selectionMode: 'published',
      design: targetVersionConfig,
      planGatedFields: {
        isPaidPlan: false,
        canUseCustomColors: false,
        canUseCustomCss: false,
        canToggleBranding: false,
        isBrandingForced: false,
        availableThemes: ['classroomio'],
        selectedTheme: 'classroomio'
      },
      labels: { loadMoreLabel: 'Load more', poweredByLabel: 'Powered by' },
      courses: [],
      timestamp: 1
    });

    vi.mocked(getWidgetById).mockResolvedValue({
      id: 'widget-1',
      organizationId: 'org-1',
      layoutType: 'card_grid',
      selectionMode: 'manual'
    } as Awaited<ReturnType<typeof getWidgetById>>);

    vi.mocked(getWidgetVersionById).mockResolvedValue({
      id: 'version-1',
      widgetId: 'widget-1',
      configSnapshot: targetVersionConfig,
      payloadSnapshot: targetPayload,
      runtimeManifest: { version: 'v1', release: 'current', entryUrl: 'https://example.com/widget.js' }
    } as Awaited<ReturnType<typeof getWidgetVersionById>>);

    vi.mocked(getNextWidgetVersion).mockResolvedValue(3);
    vi.mocked(createWidgetVersion).mockResolvedValue({ id: 'version-3' } as Awaited<
      ReturnType<typeof createWidgetVersion>
    >);
    vi.mocked(updateWidget).mockResolvedValue({ id: 'widget-1' } as Awaited<ReturnType<typeof updateWidget>>);
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({
      planName: PLAN.EARLY_ADOPTER
    } as Awaited<ReturnType<typeof getActiveOrganizationPlan>>);

    await rollbackOrganizationWidget('org-1', 'widget-1', 'user-1', { versionId: 'version-1' });

    expect(updateWidget).toHaveBeenCalledWith(
      'org-1',
      'widget-1',
      expect.objectContaining({
        layoutType: 'carousel',
        selectionMode: 'published',
        config: targetVersionConfig
      })
    );
  });

  it('re-normalizes the restored config against the org current plan, stripping custom colors no longer allowed', async () => {
    const defaultWidgetConfig = getDefaultWidgetConfig();
    const targetVersionConfig = {
      ...defaultWidgetConfig,
      colors: { ...defaultWidgetConfig.colors, primaryColor: '#ff0000' }
    };
    const WIDGET_UUID = '11111111-1111-4111-8111-111111111111';
    const ORG_UUID = '22222222-2222-4222-8222-222222222222';

    const targetPayload = ZWidgetPayload.parse({
      version: 'v1',
      widgetId: WIDGET_UUID,
      publicKey: 'wgt_test',
      organization: { id: ORG_UUID, name: 'Org', siteName: 'org' },
      layoutType: 'carousel',
      selectionMode: 'published',
      design: targetVersionConfig,
      planGatedFields: {
        isPaidPlan: true,
        canUseCustomColors: true,
        canUseCustomCss: true,
        canToggleBranding: true,
        isBrandingForced: false,
        availableThemes: ['classroomio'],
        selectedTheme: 'classroomio'
      },
      labels: { loadMoreLabel: 'Load more', poweredByLabel: 'Powered by' },
      courses: [],
      timestamp: 1
    });

    vi.mocked(getWidgetById).mockResolvedValue({
      id: 'widget-1',
      organizationId: 'org-1',
      layoutType: 'card_grid',
      selectionMode: 'manual'
    } as Awaited<ReturnType<typeof getWidgetById>>);

    vi.mocked(getWidgetVersionById).mockResolvedValue({
      id: 'version-1',
      widgetId: 'widget-1',
      configSnapshot: targetVersionConfig,
      payloadSnapshot: targetPayload,
      runtimeManifest: { version: 'v1', release: 'current', entryUrl: 'https://example.com/widget.js' }
    } as Awaited<ReturnType<typeof getWidgetVersionById>>);

    vi.mocked(getNextWidgetVersion).mockResolvedValue(3);
    vi.mocked(createWidgetVersion).mockResolvedValue({ id: 'version-3' } as Awaited<
      ReturnType<typeof createWidgetVersion>
    >);
    vi.mocked(updateWidget).mockResolvedValue({ id: 'widget-1' } as Awaited<ReturnType<typeof updateWidget>>);
    // Org has since downgraded to the free plan.
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null);

    await rollbackOrganizationWidget('org-1', 'widget-1', 'user-1', { versionId: 'version-1' });

    expect(updateWidget).toHaveBeenCalledWith(
      'org-1',
      'widget-1',
      expect.objectContaining({
        config: expect.objectContaining({ colors: defaultWidgetConfig.colors })
      })
    );
  });

  it('rejects rollback and persists nothing when the target version has an invalid payload', async () => {
    vi.mocked(getWidgetById).mockResolvedValue({
      id: 'widget-1',
      organizationId: 'org-1',
      layoutType: 'card_grid',
      selectionMode: 'manual'
    } as Awaited<ReturnType<typeof getWidgetById>>);

    vi.mocked(getWidgetVersionById).mockResolvedValue({
      id: 'version-1',
      widgetId: 'widget-1',
      configSnapshot: {},
      payloadSnapshot: { version: 'v1' },
      runtimeManifest: { version: 'v1', release: 'current', entryUrl: 'https://example.com/widget.js' }
    } as Awaited<ReturnType<typeof getWidgetVersionById>>);

    await expect(
      rollbackOrganizationWidget('org-1', 'widget-1', 'user-1', { versionId: 'version-1' })
    ).rejects.toThrow();

    expect(createWidgetVersion).not.toHaveBeenCalled();
    expect(updateWidget).not.toHaveBeenCalled();
  });
});
