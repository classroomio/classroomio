import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const dbMocks = vi.hoisted(() => ({
  createPluginVersion: vi.fn(),
  getOrganizationMemberRoleId: vi.fn(),
  getPluginById: vi.fn(),
  getPluginVersion: vi.fn(),
  listPluginVersions: vi.fn(),
  updatePluginVersionArtifact: vi.fn(),
  upsertPlugin: vi.fn()
}));

const installationMocks = vi.hoisted(() => ({
  installPlugin: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => ({
  createPluginVersion: dbMocks.createPluginVersion,
  getPluginById: dbMocks.getPluginById,
  getPluginVersion: dbMocks.getPluginVersion,
  listPluginVersions: dbMocks.listPluginVersions,
  updatePluginVersionArtifact: dbMocks.updatePluginVersionArtifact,
  upsertPlugin: dbMocks.upsertPlugin
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: dbMocks.getOrganizationMemberRoleId
}));

vi.mock('@api/services/plugin/installation', () => ({
  installPlugin: installationMocks.installPlugin
}));

import {
  assertPluginDevelopmentAccess,
  getArtifactsTargetDirectory,
  publishDevelopmentRelease
} from '@api/services/plugin/development';

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

describe('Plugin Development Service', () => {
  const validManifest = {
    manifestVersion: 1,
    id: 'com.example.dev-widget',
    slug: 'dev-widget',
    name: 'Dev Widget',
    version: '1.0.0',
    description: 'A test widget for development',
    publisher: 'Developer',
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

  let tempArtifactsDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempArtifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-test-artifacts-'));
    process.env.PLUGIN_ARTIFACTS_PATH = tempArtifactsDir;
    delete process.env.NODE_ENV;
  });

  describe('assertPluginDevelopmentAccess', () => {
    const validKey = {
      id: 'key-1',
      organizationId: 'org-1',
      type: 'api',
      scopes: ['plugin:development'],
      createdByProfileId: 'profile-admin'
    } as any;

    it('allows access when key has scope and creator is admin', async () => {
      dbMocks.getOrganizationMemberRoleId.mockResolvedValueOnce(ROLE.ADMIN);
      await expect(assertPluginDevelopmentAccess(validKey, 'org-1')).resolves.toBeUndefined();
    });

    it('rejects when key lacks plugin:development scope', async () => {
      const keyWithoutScope = { ...validKey, scopes: ['course:read'] };
      await expect(assertPluginDevelopmentAccess(keyWithoutScope, 'org-1')).rejects.toThrow(
        'Organization development access is required'
      );
    });

    it('rejects when key belongs to a different organization', async () => {
      await expect(assertPluginDevelopmentAccess(validKey, 'org-other')).rejects.toThrow(
        'Organization development access is required'
      );
    });

    it('rejects when creator is not an organization admin', async () => {
      dbMocks.getOrganizationMemberRoleId.mockResolvedValueOnce(ROLE.STUDENT);
      await expect(assertPluginDevelopmentAccess(validKey, 'org-1')).rejects.toThrow(
        'Organization admin access is required'
      );
    });
  });

  describe('getArtifactsTargetDirectory', () => {
    it('constructs a safe directory path under the artifacts root', () => {
      const target = getArtifactsTargetDirectory('com.example.widget', '1.0.0', 'sha256-abc');
      expect(target).toBe(path.resolve(tempArtifactsDir, 'com.example.widget', '1.0.0', 'sha256-abc'));
    });

    it('rejects path traversal attempts with SECURITY_VIOLATION', () => {
      expect(() => getArtifactsTargetDirectory('../../../etc', '1.0.0', 'sha256-abc')).toThrow(
        'Invalid development artifact path'
      );
    });
  });

  describe('publishDevelopmentRelease', () => {
    it('fails closed in production environment with 404', async () => {
      process.env.NODE_ENV = 'production';
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);

      await expect(
        publishDevelopmentRelease({
          manifest: validManifest,
          artifactDigest: archive.digest,
          archive: archive.buffer,
          organizationId: 'org-1',
          profileId: 'profile-1'
        })
      ).rejects.toThrow('Development releases are unavailable in production');
    });

    it('rejects when submitted manifest does not match archive manifest', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      const mismatchedManifest = { ...validManifest, version: '2.0.0' };

      await expect(
        publishDevelopmentRelease({
          manifest: mismatchedManifest,
          artifactDigest: archive.digest,
          archive: archive.buffer,
          organizationId: 'org-1',
          profileId: 'profile-1'
        })
      ).rejects.toThrow('Submitted manifest does not match');
    });

    it('rejects overwriting an immutable production release with 409', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      dbMocks.getPluginVersion.mockResolvedValueOnce({
        id: 'version-1',
        pluginId: validManifest.id,
        version: validManifest.version,
        releasedBy: 'github-actions'
      });

      await expect(
        publishDevelopmentRelease({
          manifest: validManifest,
          artifactDigest: archive.digest,
          archive: archive.buffer,
          organizationId: 'org-1',
          profileId: 'profile-1'
        })
      ).rejects.toThrow('immutable production release');
    });

    it('rejects overwriting a development release owned by another organization with 403', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      dbMocks.getPluginVersion.mockResolvedValueOnce({
        id: 'version-1',
        pluginId: validManifest.id,
        version: validManifest.version,
        releasedBy: 'development',
        releaseMetadata: { organizationId: 'org-foreign' }
      });

      await expect(
        publishDevelopmentRelease({
          manifest: validManifest,
          artifactDigest: archive.digest,
          archive: archive.buffer,
          organizationId: 'org-1',
          profileId: 'profile-1'
        })
      ).rejects.toThrow('Cannot overwrite a development release owned by another organization');
    });

    it('rejects publishing when existing plugin has versions owned by another organization with 403', async () => {
      const archive = createTestArchive([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
      dbMocks.getPluginVersion.mockResolvedValueOnce(null);
      dbMocks.getPluginById.mockResolvedValueOnce({ id: validManifest.id });
      dbMocks.listPluginVersions.mockResolvedValueOnce([
        {
          id: 'version-prev',
          pluginId: validManifest.id,
          version: '0.9.0',
          releaseMetadata: { organizationId: 'org-foreign' }
        }
      ]);

      await expect(
        publishDevelopmentRelease({
          manifest: validManifest,
          artifactDigest: archive.digest,
          archive: archive.buffer,
          organizationId: 'org-1',
          profileId: 'profile-1'
        })
      ).rejects.toThrow('Cannot publish versions for a development plugin owned by another organization');
    });

    it('successfully extracts archive, creates private version, and installs for the organization', async () => {
      const archive = createTestArchive([
        { path: 'plugin.json', content: JSON.stringify(validManifest) },
        { path: 'index.html', content: '<h1>Hello World</h1>' }
      ]);

      dbMocks.getPluginVersion.mockResolvedValueOnce(null);
      dbMocks.getPluginById.mockResolvedValueOnce(null);
      dbMocks.upsertPlugin.mockResolvedValueOnce({ id: validManifest.id });
      dbMocks.createPluginVersion.mockResolvedValueOnce({ id: 'version-new' });
      installationMocks.installPlugin.mockResolvedValueOnce({ installation: { id: 'inst-1' } });

      const result = await publishDevelopmentRelease({
        manifest: validManifest,
        artifactDigest: archive.digest,
        archive: archive.buffer,
        organizationId: 'org-1',
        profileId: 'profile-1'
      });

      expect(result).toEqual({
        pluginId: validManifest.id,
        version: validManifest.version,
        artifactDigest: archive.digest
      });

      expect(dbMocks.upsertPlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validManifest.id,
          distribution: 'private',
          status: 'published'
        })
      );

      expect(dbMocks.createPluginVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginId: validManifest.id,
          version: validManifest.version,
          releasedBy: 'development',
          reviewStatus: 'approved',
          releaseMetadata: { organizationId: 'org-1' }
        })
      );

      expect(installationMocks.installPlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginId: validManifest.id,
          version: validManifest.version,
          ownerType: 'organization',
          organizationId: 'org-1',
          installedByProfileId: 'profile-1',
          replaceExisting: true
        })
      );

      // Verify files were extracted to target directory
      const targetDir = getArtifactsTargetDirectory(validManifest.id, validManifest.version, archive.digest);
      expect(fs.existsSync(path.join(targetDir, 'plugin.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'index.html'))).toBe(true);
    });
  });
});
