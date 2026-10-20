import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  PluginVersionDigestConflictError: class PluginVersionDigestConflictError extends Error {
    pluginId = 'com.example.reading-timer';
    version = '1.2.0';
    existingDigest = `sha256-${'9'.repeat(64)}`;
  },
  registerPluginReleaseBatch: vi.fn()
}));

const storageMocks = vi.hoisted(() => ({
  getFromS3: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);
vi.mock('@cio/core/utils/s3', () => storageMocks);

import { internalPluginReleasesRouter } from '@api/routes/internal/plugin-releases';
import { registerInternalReleases } from '@api/services/plugin/release';

function createTarHeader(filePath: string, size: number): Buffer {
  const buf = Buffer.alloc(512);
  buf.write(filePath, 0, 100, 'utf8');
  buf.write('0000644\0', 100, 8, 'utf8');
  buf.write('0000000\0', 108, 8, 'utf8');
  buf.write('0000000\0', 116, 8, 'utf8');
  buf.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8');
  buf.write('00000000000\0', 136, 12, 'utf8');
  buf.write('        ', 148, 8, 'utf8');
  buf.write('0', 156, 1, 'utf8');
  buf.write('ustar\0', 257, 6, 'utf8');
  buf.write('00', 263, 2, 'utf8');

  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += buf[i];
  buf.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8');
  return buf;
}

function createTestArchive(files: { path: string; content: string }[]): { buffer: Buffer; digest: string } {
  const chunks: Buffer[] = [];
  for (const file of files) {
    const contentBuf = Buffer.from(file.content, 'utf8');
    chunks.push(createTarHeader(file.path, contentBuf.length));
    chunks.push(contentBuf);
    const remainder = contentBuf.length % 512;
    if (remainder > 0) {
      chunks.push(Buffer.alloc(512 - remainder));
    }
  }
  chunks.push(Buffer.alloc(1024));
  const tarBuffer = Buffer.concat(chunks);
  const tarGz = zlib.gzipSync(tarBuffer);
  const digest = `sha256-${crypto.createHash('sha256').update(tarGz).digest('hex')}`;
  return { buffer: tarGz, digest };
}

describe('PR-First Plugin Releases', () => {
  const deployToken = 'test-deploy-token-secret-with-at-least-32-characters';

  const validManifest = {
    manifestVersion: 1,
    id: 'com.example.reading-timer',
    slug: 'reading-timer',
    name: 'Reading Timer',
    version: '1.2.0',
    description: 'Tracks reading time in lessons',
    publisher: 'Community Dev',
    engines: {
      classroomio: '^1.0.0',
      pluginApi: '^1.0.0'
    },
    permissions: {
      required: ['course.metadata:read'],
      optional: []
    },
    dataPolicy: {
      storesCustomerData: false
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLUGIN_RELEASE_DEPLOY_TOKEN = deployToken;
    process.env.PLUGIN_ASSET_BUCKET = 'test-plugin-bucket';
    dbMocks.registerPluginReleaseBatch.mockImplementation(
      async (
        registrations: Array<{
          version: { pluginId: string; version: string; artifactDigest: string };
        }>
      ) =>
        registrations.map((registration) => ({
          pluginId: registration.version.pluginId,
          version: registration.version.version,
          artifactDigest: registration.version.artifactDigest,
          status: 'created'
        }))
    );
  });

  describe('Route: POST /internal/plugin-releases', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const response = await internalPluginReleasesRouter.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: []
        })
      });

      expect(response.status).toBe(401);
    });

    it('rejects requests with invalid deploy token with 401', async () => {
      const response = await internalPluginReleasesRouter.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-deploy-token'
        },
        body: JSON.stringify({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: []
        })
      });

      expect(response.status).toBe(401);
    });

    it('fails closed when the dedicated deploy token is not configured', async () => {
      delete process.env.PLUGIN_RELEASE_DEPLOY_TOKEN;

      const response = await internalPluginReleasesRouter.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deployToken}`
        },
        body: JSON.stringify({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: []
        })
      });

      expect(response.status).toBe(503);
    });

    it('rejects requests with malformed body with 400', async () => {
      const response = await internalPluginReleasesRouter.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deployToken}`
        },
        body: JSON.stringify({
          sourceCommit: 'not-a-40-char-sha',
          workflowRunUrl: 'not-a-url',
          releases: []
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Service: registerInternalReleases', () => {
    it('rejects duplicate plugin IDs in the same request with 400', async () => {
      await expect(
        registerInternalReleases({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: [
            {
              pluginId: 'com.example.reading-timer',
              version: '1.2.0',
              artifactDigest: `sha256-${'1'.repeat(64)}`,
              kind: 'community'
            },
            {
              pluginId: 'com.example.reading-timer',
              version: '1.3.0',
              artifactDigest: `sha256-${'2'.repeat(64)}`,
              kind: 'community'
            }
          ]
        })
      ).rejects.toThrow('Duplicate plugin ID');
    });

    it('rejects when the release archive is not found in storage with 404', async () => {
      storageMocks.getFromS3.mockResolvedValue({ success: false, data: null });

      await expect(
        registerInternalReleases({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: [
            {
              pluginId: 'com.example.reading-timer',
              version: '1.2.0',
              artifactDigest: `sha256-${'1'.repeat(64)}`,
              kind: 'community'
            }
          ]
        })
      ).rejects.toThrow('archive not found');
    });

    it('rejects version conflict when existing version has a different digest with 409', async () => {
      dbMocks.registerPluginReleaseBatch.mockRejectedValue(new dbMocks.PluginVersionDigestConflictError());
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      storageMocks.getFromS3.mockResolvedValue({
        success: true,
        data: { Body: { transformToByteArray: async () => new Uint8Array(archive.buffer) } }
      });

      await expect(
        registerInternalReleases({
          sourceCommit: 'a'.repeat(40),
          workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
          releases: [
            {
              pluginId: 'com.example.reading-timer',
              version: '1.2.0',
              artifactDigest: archive.digest,
              kind: 'community'
            }
          ]
        })
      ).rejects.toThrow('already exists with a different digest');
    });

    it('handles idempotent replay when version exists with the exact same digest', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      storageMocks.getFromS3.mockResolvedValue({
        success: true,
        data: { Body: { transformToByteArray: async () => new Uint8Array(archive.buffer) } }
      });
      dbMocks.registerPluginReleaseBatch.mockResolvedValue([
        {
          pluginId: 'com.example.reading-timer',
          version: '1.2.0',
          artifactDigest: archive.digest,
          status: 'already_registered'
        }
      ]);

      const result = await registerInternalReleases({
        sourceCommit: 'a'.repeat(40),
        workflowRunUrl: 'https://github.com/classroomio/classroomio-plugins/actions/runs/123',
        releases: [
          {
            pluginId: 'com.example.reading-timer',
            version: '1.2.0',
            artifactDigest: archive.digest,
            kind: 'community'
          }
        ]
      });

      expect(result.registered).toHaveLength(1);
      expect(result.registered[0].status).toBe('already_registered');
      expect(dbMocks.registerPluginReleaseBatch).toHaveBeenCalledOnce();
    });

    it('successfully registers an approved release with provenance metadata', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);

      storageMocks.getFromS3.mockResolvedValue({
        success: true,
        data: {
          Body: {
            transformToByteArray: async () => new Uint8Array(archive.buffer)
          }
        }
      });

      const sourceCommit = 'b'.repeat(40);
      const workflowRunUrl = 'https://github.com/classroomio/classroomio-plugins/actions/runs/456';

      const result = await registerInternalReleases({
        sourceCommit,
        workflowRunUrl,
        releases: [
          {
            pluginId: 'com.example.reading-timer',
            version: '1.2.0',
            artifactDigest: archive.digest,
            kind: 'community'
          }
        ]
      });

      expect(result.registered).toHaveLength(1);
      expect(result.registered[0].status).toBe('created');
      expect(result.registered[0].artifactDigest).toBe(archive.digest);

      expect(dbMocks.registerPluginReleaseBatch).toHaveBeenCalledWith([
        expect.objectContaining({
          plugin: expect.objectContaining({
            id: 'com.example.reading-timer',
            slug: 'reading-timer',
            status: 'published',
            distribution: 'public'
          }),
          version: expect.objectContaining({
            pluginId: 'com.example.reading-timer',
            version: '1.2.0',
            artifactDigest: archive.digest,
            sourceCommit,
            releaseRunUrl: workflowRunUrl,
            releasedBy: 'github-actions',
            reviewStatus: 'approved'
          })
        })
      ]);
    });
  });
});
