import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  updateWidget: vi.fn(),
  updateWidgetWithCourses: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn()
}));

import { AppError } from '@api/utils/errors';
import { rollbackOrganizationWidget } from '@api/services/widget';
import {
  createWidgetVersion,
  getNextWidgetVersion,
  getWidgetById,
  getWidgetVersionById,
  updateWidgetWithCourses
} from '@cio/db/queries/widget';

const ORG_ID = '0d7f70bc-6a2c-4ed8-b352-cb5b0f3c9a11';
const WIDGET_ID = '8a1e5f60-2b1d-4c3a-9e2f-6d5a7b8c9d01';
const USER_ID = 'c2d4f6a8-0b9c-4d2e-8f1a-3e5d7c9b1a23';
const VERSION_ID = 'f4a6c8e0-2d4b-6f8a-0c2e-4a6b8d0f2e34';
const COURSE_A_ID = 'aa000000-0000-4000-8000-00000000000a';
const COURSE_B_ID = 'bb000000-0000-4000-8000-00000000000b';

function buildPayloadSnapshot() {
  return {
    version: 'v1' as const,
    widgetId: WIDGET_ID,
    publicKey: 'wgt_rollbacktest',
    organization: {
      id: ORG_ID,
      name: 'Acme',
      siteName: 'acme',
      customDomain: null
    },
    layoutType: 'carousel' as const,
    selectionMode: 'manual' as const,
    design: {},
    planGatedFields: {
      isPaidPlan: false,
      canUseCustomColors: false,
      canUseCustomCss: false,
      canToggleBranding: false,
      isBrandingForced: true,
      availableThemes: ['classroomio' as const],
      selectedTheme: 'classroomio' as const
    },
    labels: {
      loadMoreLabel: 'Load more',
      poweredByLabel: 'Powered by ClassroomIO'
    },
    courses: [
      {
        id: COURSE_A_ID,
        slug: 'course-a',
        title: 'Course A',
        lessonCount: 3,
        exerciseCount: 0,
        ratingCount: 0,
        featured: false,
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        url: `https://acme.test/courses/course-a`
      },
      {
        id: COURSE_B_ID,
        slug: 'course-b',
        title: 'Course B',
        lessonCount: 5,
        exerciseCount: 0,
        ratingCount: 0,
        featured: false,
        tags: [],
        createdAt: '2026-02-01T00:00:00.000Z',
        url: `https://acme.test/courses/course-b`
      }
    ],
    tagPool: [],
    categories: [],
    timestamp: 1_750_000_000_000
  };
}

function mockWidget() {
  return { id: WIDGET_ID, organizationId: ORG_ID } as Awaited<ReturnType<typeof getWidgetById>>;
}

describe('rollbackOrganizationWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('repoints the published pointer to the target version without creating a new version', async () => {
    const payloadSnapshot = buildPayloadSnapshot();
    const version = {
      id: VERSION_ID,
      widgetId: WIDGET_ID,
      configSnapshot: { themePreset: 'graphite' },
      payloadSnapshot
    } as Awaited<ReturnType<typeof getWidgetVersionById>>;

    vi.mocked(getWidgetById).mockResolvedValue(mockWidget());
    vi.mocked(getWidgetVersionById).mockResolvedValue(version);
    vi.mocked(updateWidgetWithCourses).mockResolvedValue(mockWidget());

    const result = await rollbackOrganizationWidget(ORG_ID, WIDGET_ID, USER_ID, { versionId: VERSION_ID });

    expect(getNextWidgetVersion).not.toHaveBeenCalled();
    expect(createWidgetVersion).not.toHaveBeenCalled();

    expect(updateWidgetWithCourses).toHaveBeenCalledTimes(1);
    const [orgIdArg, widgetIdArg, updates, courseIds] = vi.mocked(updateWidgetWithCourses).mock.calls[0];

    expect([orgIdArg, widgetIdArg]).toEqual([ORG_ID, WIDGET_ID]);
    expect(updates).toMatchObject({
      config: { themePreset: 'graphite' },
      layoutType: 'carousel',
      selectionMode: 'manual',
      status: 'PUBLISHED',
      hasUnpublishedChanges: false,
      latestPublishedVersionId: VERSION_ID,
      updatedByUserId: USER_ID
    });
    expect(courseIds).toEqual([COURSE_A_ID, COURSE_B_ID]);
    expect(result).toMatchObject({
      widget: { id: WIDGET_ID },
      version: { id: VERSION_ID }
    });
  });

  it('clears course assignments when the restored snapshot has no courses', async () => {
    const payloadSnapshot = { ...buildPayloadSnapshot(), courses: [] };
    const version = {
      id: VERSION_ID,
      widgetId: WIDGET_ID,
      configSnapshot: {},
      payloadSnapshot
    } as Awaited<ReturnType<typeof getWidgetVersionById>>;

    vi.mocked(getWidgetById).mockResolvedValue(mockWidget());
    vi.mocked(getWidgetVersionById).mockResolvedValue(version);
    vi.mocked(updateWidgetWithCourses).mockResolvedValue(mockWidget());

    await rollbackOrganizationWidget(ORG_ID, WIDGET_ID, USER_ID, { versionId: VERSION_ID });

    const courseIds = vi.mocked(updateWidgetWithCourses).mock.calls[0][3];
    expect(courseIds).toEqual([]);
  });

  it('rejects malformed snapshots before writing anything', async () => {
    const version = {
      id: VERSION_ID,
      widgetId: WIDGET_ID,
      configSnapshot: {},
      payloadSnapshot: { layoutType: 'carousel' }
    } as unknown as Awaited<ReturnType<typeof getWidgetVersionById>>;

    vi.mocked(getWidgetById).mockResolvedValue(mockWidget());
    vi.mocked(getWidgetVersionById).mockResolvedValue(version);

    await expect(
      rollbackOrganizationWidget(ORG_ID, WIDGET_ID, USER_ID, { versionId: VERSION_ID })
    ).rejects.toBeInstanceOf(AppError);
    expect(updateWidgetWithCourses).not.toHaveBeenCalled();
  });

  it('returns 404 when the target version does not exist', async () => {
    vi.mocked(getWidgetById).mockResolvedValue(mockWidget());
    vi.mocked(getWidgetVersionById).mockResolvedValue(null);

    await expect(
      rollbackOrganizationWidget(ORG_ID, WIDGET_ID, USER_ID, { versionId: VERSION_ID })
    ).rejects.toMatchObject({
      statusCode: 404
    });
    expect(updateWidgetWithCourses).not.toHaveBeenCalled();
  });
});
