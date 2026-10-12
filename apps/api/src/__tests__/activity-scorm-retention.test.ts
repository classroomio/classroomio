import 'dotenv/config';

import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const storedObjects = new Map<string, string>();

vi.mock('@cio/core/config/storage', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/storage')>();

  return {
    ...original,
    getStorageConfig: () => ({ bucketScorm: 'scorm' }),
    getS3Client: () => ({
      send: async (command: unknown) => {
        if (command instanceof ListObjectsV2Command) {
          const prefix = command.input.Prefix ?? '';
          const keys = [...storedObjects.keys()].filter((key) => key.startsWith(prefix));

          return { Contents: keys.map((Key) => ({ Key })), IsTruncated: false };
        }

        if (command instanceof DeleteObjectsCommand) {
          const keys = (command.input.Delete?.Objects ?? []).map((entry) => entry.Key).filter(Boolean);

          for (const key of keys) storedObjects.delete(key as string);

          return { Deleted: keys.map((Key) => ({ Key })) };
        }

        throw new Error('unexpected S3 command');
      }
    })
  };
});

import { runScormRetention } from '@cio/core/services/activity/retention';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('scorm retention service (PR 14)', () => {
  it('purges replaced unreferenced versions and keeps ZIPs', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `rt-${suffix}`, siteName: `rt-${suffix}` })
      .returning();
    const [asset] = await db
      .insert(schema.asset)
      .values({ organizationId: organization.id, kind: 'scorm', title: 'Retention zip' })
      .returning();

    const prefixOf = (version: number) => `scorm/rt-${suffix}/v${version}`;
    const [first] = await db
      .insert(schema.contentPackageVersion)
      .values({
        assetId: asset.id,
        versionNumber: 1,
        status: 'ready',
        isCurrent: false,
        format: 'scorm12',
        uploadKey: `${prefixOf(1)}.zip`,
        contentPrefix: prefixOf(1)
      })
      .returning();
    if (!first) throw new Error('missing version 1');

    const [second] = await db
      .insert(schema.contentPackageVersion)
      .values({
        assetId: asset.id,
        versionNumber: 2,
        status: 'ready',
        isCurrent: false,
        format: 'scorm12',
        uploadKey: `${prefixOf(2)}.zip`,
        contentPrefix: prefixOf(2)
      })
      .returning();
    if (!second) throw new Error('missing version 2');

    const [third] = await db
      .insert(schema.contentPackageVersion)
      .values({
        assetId: asset.id,
        versionNumber: 3,
        status: 'ready',
        isCurrent: true,
        format: 'scorm12',
        uploadKey: `${prefixOf(3)}.zip`,
        contentPrefix: prefixOf(3)
      })
      .returning();
    if (!third) throw new Error('missing version 3');

    const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();
    await db
      .update(schema.contentPackageVersion)
      .set({ updatedAt: ancient })
      .where(eq(schema.contentPackageVersion.id, second.id));

    storedObjects.clear();
    storedObjects.set(`${prefixOf(1)}/sco.html`, '<html>v1</html>');
    storedObjects.set(`${prefixOf(2)}/sco.html`, '<html>v2</html>');
    storedObjects.set(`${prefixOf(2)}/index.json`, '[]');
    storedObjects.set(`${prefixOf(2)}.zip`, 'zip-bytes');

    try {
      const result = await runScormRetention(90, 30);

      expect(result.versionsDeleted).toBe(1);
      expect(result.objectsDeleted).toBe(2);
      expect(storedObjects.has(`${prefixOf(2)}/sco.html`)).toBe(false);
      expect(storedObjects.has(`${prefixOf(2)}/index.json`)).toBe(false);
      expect(storedObjects.get(`${prefixOf(2)}.zip`)).toBe('zip-bytes');
      expect(storedObjects.get(`${prefixOf(1)}/sco.html`)).toBe('<html>v1</html>');

      const remaining = await db
        .select({ id: schema.contentPackageVersion.id })
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.assetId, asset.id));

      expect(remaining.map((row) => row.id).sort()).toEqual([first.id, third.id].sort());
    } finally {
      storedObjects.clear();
      await db.delete(schema.asset).where(eq(schema.asset.organizationId, organization.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
    }
  });
});
