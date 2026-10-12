import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: { set: (key: string, val: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-1' });
    await next();
  }
}));

vi.mock('@api/middlewares/org-team-member', () => ({
  orgTeamMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  }
}));

vi.mock('@api/middlewares/org-admin', () => ({
  orgAdminMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  }
}));

vi.mock('@api/services/activity/plan', () => ({
  assertActivityKindAllowed: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/core/services/activity/packages', () => ({
  createScormPackage: vi.fn(),
  createScormPackageVersion: vi.fn(),
  processScormPackageVersion: vi.fn(),
  makeScormPackageVersionCurrent: vi.fn(),
  getScormPackage: vi.fn(),
  deleteScormPackage: vi.fn()
}));

import {
  createScormPackage,
  createScormPackageVersion,
  deleteScormPackage,
  getScormPackage,
  makeScormPackageVersionCurrent,
  processScormPackageVersion
} from '@cio/core/services/activity/packages';
import { assertActivityKindAllowed } from '@api/services/activity/plan';
import { activityRouter } from '@api/routes/activity';

function buildApp() {
  return new Hono().route('/activity', activityRouter);
}

const ORG_ID = 'org-test-1';
const HEADERS = {
  'content-type': 'application/json',
  'cio-org-id': ORG_ID
};

describe('activity packages routes (PR 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /activity/packages creates a package and returns 201', async () => {
    const app = buildApp();
    const payload = {
      asset: { id: 'asset-1', title: 'Test SCORM' },
      version: { id: 'version-1', versionNumber: 1 },
      uploadUrl: 'https://upload.test/presigned',
      uploadKey: 'scorm/asset-1/v1.zip'
    };
    vi.mocked(createScormPackage).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ fileName: 'module.zip', fileSize: 1024, title: 'Test SCORM' })
    });

    expect(response.status).toBe(201);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(json.data.asset.id).toBe('asset-1');
    expect(assertActivityKindAllowed).toHaveBeenCalledWith(ORG_ID, 'scorm');
    expect(createScormPackage).toHaveBeenCalledWith(ORG_ID, 'user-1', {
      fileName: 'module.zip',
      fileSize: 1024,
      title: 'Test SCORM'
    });
  });

  it('POST /activity/packages/:assetId/versions creates a new version and returns 201', async () => {
    const app = buildApp();
    const payload = {
      version: { id: 'version-2', versionNumber: 2 },
      uploadUrl: 'https://upload.test/presigned-v2',
      uploadKey: 'scorm/asset-1/v2.zip'
    };
    vi.mocked(createScormPackageVersion).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages/asset-1/versions', {
      method: 'POST',
      headers: HEADERS
    });

    expect(response.status).toBe(201);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(json.data.version.versionNumber).toBe(2);
    expect(createScormPackageVersion).toHaveBeenCalledWith(ORG_ID, 'asset-1', 'user-1');
  });

  it('POST /activity/packages/:assetId/versions/:versionId/process triggers extraction', async () => {
    const app = buildApp();
    const payload = {
      version: { id: 'version-1', status: 'processing' },
      jobId: 'job-123',
      status: 'waiting',
      stage: 'enqueued'
    };
    vi.mocked(processScormPackageVersion).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages/asset-1/versions/version-1/process', {
      method: 'POST',
      headers: HEADERS
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(json.data.jobId).toBe('job-123');
    expect(processScormPackageVersion).toHaveBeenCalledWith(ORG_ID, 'asset-1', 'version-1', 'user-1');
  });

  it('POST /activity/packages/:assetId/versions/:versionId/current promotes a version', async () => {
    const app = buildApp();
    const payload = {
      version: { id: 'version-2', isCurrent: true },
      closedAttempts: 3
    };
    vi.mocked(makeScormPackageVersionCurrent).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages/asset-1/versions/version-2/current', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ closeOpenAttempts: true })
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(json.data.closedAttempts).toBe(3);
    expect(makeScormPackageVersionCurrent).toHaveBeenCalledWith(ORG_ID, 'asset-1', 'version-2', {
      closeOpenAttempts: true
    });
  });

  it('GET /activity/packages/:assetId fetches package details with units and usage', async () => {
    const app = buildApp();
    const payload = {
      asset: { id: 'asset-1', title: 'Test SCORM' },
      versions: [{ id: 'version-1', versionNumber: 1 }],
      currentVersion: { id: 'version-1', versionNumber: 1 },
      units: [{ id: 'unit-1', identifier: 'sco-1' }],
      usedBy: [{ activityId: 'act-1', courseId: 'c-1', title: 'Module 1' }]
    };
    vi.mocked(getScormPackage).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages/asset-1', {
      method: 'GET',
      headers: HEADERS
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(json.data.usedBy).toHaveLength(1);
    expect(getScormPackage).toHaveBeenCalledWith(ORG_ID, 'asset-1');
  });

  it('DELETE /activity/packages/:assetId deletes the package', async () => {
    const app = buildApp();
    const payload = { id: 'asset-1' };
    vi.mocked(deleteScormPackage).mockResolvedValue(payload as never);

    const response = await app.request('/activity/packages/asset-1', {
      method: 'DELETE',
      headers: HEADERS
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { success: boolean; data: typeof payload };
    expect(json.success).toBe(true);
    expect(deleteScormPackage).toHaveBeenCalledWith(ORG_ID, 'asset-1');
  });

  it('returns 403 when plan gating fails', async () => {
    const app = buildApp();
    vi.mocked(assertActivityKindAllowed).mockRejectedValue(
      new AppError('SCORM packages require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await app.request('/activity/packages', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ fileName: 'module.zip', fileSize: 1024 })
    });

    expect(response.status).toBe(403);
  });
});
