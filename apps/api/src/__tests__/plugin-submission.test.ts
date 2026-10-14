import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  createPluginSubmission: vi.fn(),
  getPluginSubmissionById: vi.fn(),
  listPluginSubmissions: vi.fn(),
  updatePluginSubmissionStatus: vi.fn(),
  getPluginById: vi.fn(),
  getPluginVersion: vi.fn(),
  upsertPlugin: vi.fn(),
  createPluginVersion: vi.fn(),
  updatePluginVersionReviewStatus: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);

import {
  completeSubmission,
  createSubmissionIntent,
  reviewSubmission,
  storeQuarantineUpload
} from '@api/services/plugin/submission';

function createDeterministicTarHeader(fileName: string, size: number): Buffer {
  const buf = Buffer.alloc(512);
  buf.write(fileName, 0, 100, 'utf8');
  buf.write((0o644).toString(8).padStart(7, '0') + '\0', 100, 8, 'ascii');
  buf.write((0).toString(8).padStart(7, '0') + '\0', 108, 8, 'ascii');
  buf.write((0).toString(8).padStart(7, '0') + '\0', 116, 8, 'ascii');
  buf.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
  buf.write((0).toString(8).padStart(11, '0') + '\0', 136, 12, 'ascii');
  buf.fill(0x20, 148, 156);
  buf.write('0', 156, 1, 'ascii');
  buf.write('ustar\0', 257, 6, 'ascii');
  buf.write('00', 263, 2, 'ascii');

  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += buf[i];
  buf.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  return buf;
}

function buildTestTarGz(files: Array<{ path: string; content: string }>): Buffer {
  const chunks: Buffer[] = [];
  for (const file of files) {
    const data = Buffer.from(file.content, 'utf8');
    chunks.push(createDeterministicTarHeader(file.path, data.length));
    chunks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad > 0) chunks.push(Buffer.alloc(pad));
  }
  chunks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(chunks));
}

describe('Plugin Submission Engine', () => {
  const tempQuarantineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-test-quarantine-'));
  const tempArtifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-test-artifacts-'));

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLUGIN_QUARANTINE_PATH = tempQuarantineDir;
    process.env.PLUGIN_ARTIFACTS_PATH = tempArtifactsDir;
  });

  const validManifest = {
    manifestVersion: 1,
    id: 'com.classroomio.certificate-studio',
    slug: 'certificate-studio',
    name: 'Certificate Studio',
    version: '1.0.0',
    description: 'Design and issue custom certificates',
    publisher: 'ClassroomIO',
    engines: {
      classroomio: '^1.0.0',
      pluginApi: '^1.0.0'
    },
    permissions: {
      required: ['certificate.template:read', 'certificate.template:write'],
      optional: []
    },
    dataPolicy: {
      storesCustomerData: false
    }
  };

  it('rejects first-party release lane for non-ClassroomIO namespace', async () => {
    await expect(
      createSubmissionIntent({
        pluginId: 'com.partner.custom-tool',
        version: '1.0.0',
        releaseLane: 'first-party',
        artifactDigest: 'sha256-abc123',
        profileId: 'profile-1'
      })
    ).rejects.toThrow('First-party plugins must use the com.classroomio.* namespace');
  });

  it('rejects community release lane for reserved ClassroomIO namespace', async () => {
    await expect(
      createSubmissionIntent({
        pluginId: 'com.classroomio.hacked',
        version: '1.0.0',
        releaseLane: 'community',
        artifactDigest: 'sha256-abc123',
        profileId: 'profile-1'
      })
    ).rejects.toThrow('Community plugins cannot use the reserved com.classroomio.* namespace');
  });

  it('rejects private release lane without organizationId', async () => {
    await expect(
      createSubmissionIntent({
        pluginId: 'com.org.internal-plugin',
        version: '1.0.0',
        releaseLane: 'private',
        artifactDigest: 'sha256-abc123',
        profileId: 'profile-1'
      })
    ).rejects.toThrow('Private plugins require an organizationId');
  });

  it('creates submission intent and returns upload url', async () => {
    dbMocks.getPluginVersion.mockResolvedValueOnce(null);
    dbMocks.createPluginSubmission.mockResolvedValueOnce({
      id: 'sub-123',
      pluginId: 'com.classroomio.certificate-studio',
      version: '1.0.0',
      releaseLane: 'first-party',
      artifactDigest: 'sha256-112233',
      status: 'pending_upload'
    });

    const result = await createSubmissionIntent({
      pluginId: 'com.classroomio.certificate-studio',
      version: '1.0.0',
      releaseLane: 'first-party',
      artifactDigest: 'sha256-112233',
      profileId: 'profile-1'
    });

    expect(result.uploadUrl).toBe('/plugins/submissions/sub-123/upload');
    expect(dbMocks.createPluginSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginId: 'com.classroomio.certificate-studio',
        status: 'pending_upload'
      })
    );
  });

  it('verifies archive SHA-256 digest on upload and rejects mismatched uploads', async () => {
    const archiveBuffer = buildTestTarGz([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
    const actualDigest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'pending_upload',
      artifactDigest: 'sha256-wronghash'
    });

    await expect(storeQuarantineUpload('sub-1', archiveBuffer)).rejects.toThrow('Archive SHA-256 digest mismatch');
  });

  it('quarantines upload when digest matches', async () => {
    const archiveBuffer = buildTestTarGz([{ path: 'plugin.json', content: JSON.stringify(validManifest) }]);
    const actualDigest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-valid',
      status: 'pending_upload',
      artifactDigest: actualDigest
    });
    dbMocks.updatePluginSubmissionStatus.mockResolvedValueOnce({
      id: 'sub-valid',
      status: 'quarantined'
    });

    const updated = await storeQuarantineUpload('sub-valid', archiveBuffer);
    expect(updated.status).toBe('quarantined');
    expect(dbMocks.updatePluginSubmissionStatus).toHaveBeenCalledWith('sub-valid', 'quarantined');
  });

  it('rejects archive containing forbidden internal imports (@cio/ or $lib/)', async () => {
    const maliciousCode = 'import { something } from "@cio/internal-auth";';
    const archiveBuffer = buildTestTarGz([
      { path: 'plugin.json', content: JSON.stringify(validManifest) },
      { path: 'dist/index.js', content: maliciousCode }
    ]);
    const digest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    const subDir = path.join(tempQuarantineDir, 'sub-bad-import');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'package.tar.gz'), archiveBuffer);

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-bad-import',
      status: 'quarantined',
      pluginId: validManifest.id,
      version: validManifest.version,
      artifactDigest: digest,
      releaseLane: 'first-party'
    });

    await expect(completeSubmission('sub-bad-import')).rejects.toThrow('forbidden host internal import detected');
  });

  it('auto-approves first-party release lane and unpacks to artifacts', async () => {
    const archiveBuffer = buildTestTarGz([
      { path: 'plugin.json', content: JSON.stringify(validManifest) },
      { path: 'dist/index.html', content: '<h1>Certificate Studio</h1>' }
    ]);
    const digest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    const subDir = path.join(tempQuarantineDir, 'sub-fp');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'package.tar.gz'), archiveBuffer);

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-fp',
      status: 'quarantined',
      pluginId: validManifest.id,
      version: validManifest.version,
      artifactDigest: digest,
      releaseLane: 'first-party'
    });
    dbMocks.upsertPlugin.mockResolvedValueOnce({ id: validManifest.id });
    dbMocks.createPluginVersion.mockResolvedValueOnce({ id: 'ver-1' });
    dbMocks.updatePluginSubmissionStatus.mockResolvedValueOnce({
      id: 'sub-fp',
      status: 'approved'
    });

    const result = await completeSubmission('sub-fp');
    expect(result.submission.status).toBe('approved');
    expect(dbMocks.upsertPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        id: validManifest.id,
        distribution: 'public',
        status: 'published'
      })
    );
    expect(dbMocks.createPluginVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginId: validManifest.id,
        reviewStatus: 'approved'
      })
    );

    const unpackedPath = path.join(
      tempArtifactsDir,
      validManifest.id,
      validManifest.version,
      digest,
      'dist/index.html'
    );
    expect(fs.existsSync(unpackedPath)).toBe(true);
  });

  it('marks community release lane as in_review for marketplace evaluation', async () => {
    const communityManifest = {
      ...validManifest,
      id: 'org.community.math-solver',
      slug: 'math-solver',
      publisher: 'Community Dev'
    };

    const archiveBuffer = buildTestTarGz([
      { path: 'plugin.json', content: JSON.stringify(communityManifest) },
      { path: 'dist/index.html', content: '<h1>Math Solver</h1>' }
    ]);
    const digest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    const subDir = path.join(tempQuarantineDir, 'sub-community');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'package.tar.gz'), archiveBuffer);

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-community',
      status: 'quarantined',
      pluginId: communityManifest.id,
      version: communityManifest.version,
      artifactDigest: digest,
      releaseLane: 'community'
    });
    dbMocks.getPluginVersion.mockResolvedValueOnce(null);
    dbMocks.createPluginVersion.mockResolvedValueOnce({ id: 'ver-comm' });
    dbMocks.updatePluginSubmissionStatus.mockResolvedValueOnce({
      id: 'sub-community',
      status: 'in_review'
    });

    const result = await completeSubmission('sub-community');
    expect(result.submission.status).toBe('in_review');
    expect(dbMocks.createPluginVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginId: communityManifest.id,
        reviewStatus: 'pending'
      })
    );
  });

  it('allows reviewer to approve an in_review submission and publish it', async () => {
    const communityManifest = {
      ...validManifest,
      id: 'org.community.math-solver',
      slug: 'math-solver',
      publisher: 'Community Dev'
    };
    const archiveBuffer = buildTestTarGz([
      { path: 'plugin.json', content: JSON.stringify(communityManifest) },
      { path: 'dist/index.html', content: '<h1>Math Solver</h1>' }
    ]);
    const digest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;

    const subDir = path.join(tempQuarantineDir, 'sub-review-1');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'package.tar.gz'), archiveBuffer);

    dbMocks.getPluginSubmissionById.mockResolvedValueOnce({
      id: 'sub-review-1',
      status: 'in_review',
      pluginId: communityManifest.id,
      version: communityManifest.version,
      artifactDigest: digest
    });
    dbMocks.upsertPlugin.mockResolvedValueOnce({ id: communityManifest.id });
    dbMocks.updatePluginVersionReviewStatus.mockResolvedValueOnce({ id: 'ver-1', reviewStatus: 'approved' });
    dbMocks.updatePluginSubmissionStatus.mockResolvedValueOnce({
      id: 'sub-review-1',
      status: 'approved'
    });

    const approved = await reviewSubmission('sub-review-1', 'approve', 'Looks great!');
    expect(approved.status).toBe('approved');
    expect(dbMocks.updatePluginVersionReviewStatus).toHaveBeenCalledWith(
      communityManifest.id,
      communityManifest.version,
      'approved'
    );
  });
});
