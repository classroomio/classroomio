import 'dotenv/config';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const storage = vi.hoisted(() => {
  const objects = new Set<string>();
  const sent: { command: string; input: Record<string, string> }[] = [];
  const client = {
    send: async (command: { constructor: { name: string }; input: Record<string, string> }) => {
      const name = command.constructor.name;
      const input = command.input;
      sent.push({ command: name, input });

      if (name === 'ListObjectsV2Command') {
        const contents = [...objects]
          .filter((entry) => entry.startsWith(`${input.Bucket}:${input.Prefix}`))
          .map((entry) => ({ Key: entry.slice(input.Bucket.length + 1) }));
        return { Contents: contents, IsTruncated: false };
      }
      if (name === 'CopyObjectCommand') {
        objects.add(`${input.Bucket}:${input.Key}`);
      }
      if (name === 'DeleteObjectCommand') {
        objects.delete(`${input.Bucket}:${input.Key}`);
      }
      if (name === 'DeleteObjectsCommand') {
        const deleteInput = input as unknown as { Delete: { Objects: { Key: string }[] } };
        for (const entry of deleteInput.Delete.Objects) objects.delete(`${input.Bucket}:${entry.Key}`);
      }

      return {};
    }
  };

  return { objects, sent, client };
});

vi.mock('@cio/core/config/storage', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/storage')>();

  return {
    ...original,
    getS3Client: () => storage.client,
    getStorageConfig: () => ({
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      forcePathStyle: true,
      bucketVideos: 'videos',
      bucketDocuments: 'documents',
      bucketMedia: 'media',
      bucketScorm: 'scorm',
      mediaPublicBaseUrl: null,
      presignUploadExpiresSeconds: 3600,
      presignDownloadExpiresSeconds: 3600
    })
  };
});

import { cloneCourse } from '@api/services/course/clone';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('cross-org asset transfer', () => {
  beforeEach(() => {
    storage.objects.clear();
    storage.sent.length = 0;
  });

  it('copies uploaded files into storage the target org owns', async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await db.transaction(async (tx) => {
        const profileId = crypto.randomUUID();
        const email = `transfer-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
        await tx.insert(schema.user).values({ id: profileId, name: 'Transfer', email });
        const [profile] = await tx
          .insert(schema.profile)
          .values({ id: profileId, fullname: 'Transfer', username: `transfer-${Date.now()}`, email })
          .returning({ id: schema.profile.id });

        const templateOrg = await createOrganization({ name: `transfer-source-${Date.now()}` }, tx);
        const courseOrg = await createOrganization({ name: `transfer-target-${Date.now()}` }, tx);
        const sourceKey = `${templateOrg.id}/abc123-guide.pdf`;
        const [document] = await tx
          .insert(schema.asset)
          .values({
            organizationId: templateOrg.id,
            kind: 'document',
            provider: 'upload',
            storageKey: sourceKey,
            title: 'Guide'
          })
          .returning();
        await tx
          .update(schema.asset)
          .set({ thumbnailUrl: `https://cdn.example/thumbnails/${document.id}/poster.jpg` })
          .where(eq(schema.asset.id, document.id));
        storage.objects.add(`documents:${sourceKey}`);
        storage.objects.add(`media:thumbnails/${document.id}/poster.jpg`);

        const [group] = await tx
          .insert(schema.group)
          .values({ name: 'Docs', organizationId: templateOrg.id })
          .returning();
        const [template] = await tx
          .insert(schema.course)
          .values({
            title: 'Docs template',
            description: 'Template with a document',
            groupId: group.id,
            isTemplate: true,
            slug: `docs-template-${templateOrg.id}`
          })
          .returning();
        await tx.insert(schema.lesson).values({
          courseId: template.id,
          title: 'Read this',
          order: 1,
          documents: [{ type: 'pdf', name: 'Guide', link: sourceKey, key: sourceKey, assetId: document.id }]
        });

        const copy = await cloneCourse(
          template.id,
          { title: 'From template', userId: profile.id, organizationId: courseOrg.id, slug: `docs-${courseOrg.id}` },
          tx
        );

        const [copiedAsset] = await tx.select().from(schema.asset).where(eq(schema.asset.organizationId, courseOrg.id));
        expect(copiedAsset.id).not.toBe(document.id);
        expect(copiedAsset.storageKey?.startsWith(`${courseOrg.id}/`)).toBe(true);
        expect(copiedAsset.storageKey).not.toContain(templateOrg.id);
        expect(copiedAsset.thumbnailUrl).toBe(`https://cdn.example/thumbnails/${copiedAsset.id}/poster.jpg`);
        expect(storage.objects.has(`documents:${copiedAsset.storageKey}`)).toBe(true);
        expect(storage.objects.has(`media:thumbnails/${copiedAsset.id}/poster.jpg`)).toBe(true);

        const [copiedLesson] = await tx
          .select({ documents: schema.lesson.documents })
          .from(schema.lesson)
          .where(eq(schema.lesson.courseId, copy.id));
        const copiedDocument = copiedLesson.documents?.[0];
        expect(copiedDocument?.assetId).toBe(copiedAsset.id);
        expect(copiedDocument?.key).toBe(copiedAsset.storageKey);
        expect(JSON.stringify(copiedLesson.documents)).not.toContain(templateOrg.id);

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it('removes copied files when the copy fails', async () => {
    const { withAssetStorageRollback, transferUploadedAsset } = await import(
      '@cio/core/services/assets/asset-transfer'
    );
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const failure = new Error('later write failed');
    const sourceObjects: string[] = [];
    let copiedAssetId = '';

    await expect(
      withAssetStorageRollback(() =>
        db.transaction(async (tx) => {
          const profileId = crypto.randomUUID();
          const email = `transfer-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
          await tx.insert(schema.user).values({ id: profileId, name: 'Transfer', email });
          const [profile] = await tx
            .insert(schema.profile)
            .values({ id: profileId, fullname: 'Transfer', username: `transfer-${Date.now()}`, email })
            .returning({ id: schema.profile.id });
          const sourceOrg = await createOrganization({ name: `transfer-fail-source-${Date.now()}` }, tx);
          const targetOrg = await createOrganization({ name: `transfer-fail-target-${Date.now()}` }, tx);
          const [video] = await tx
            .insert(schema.asset)
            .values({
              organizationId: sourceOrg.id,
              kind: 'video',
              provider: 'upload',
              storageKey: `${sourceOrg.id}/x-clip.mp4`
            })
            .returning();
          sourceObjects.push(`videos:${sourceOrg.id}/x-clip.mp4`, `videos:${video.id}/hls/master.m3u8`);
          for (const entry of sourceObjects) storage.objects.add(entry);

          const transfer = await transferUploadedAsset(video, targetOrg.id, profile.id, tx);
          copiedAssetId = transfer.asset.id;
          expect(storage.objects.has(`videos:${copiedAssetId}/hls/master.m3u8`)).toBe(true);
          expect(storage.objects.has(`videos:${transfer.asset.storageKey}`)).toBe(true);

          throw failure;
        })
      )
    ).rejects.toBe(failure);

    expect([...storage.objects].sort()).toEqual(sourceObjects.sort());
    expect(copiedAssetId).not.toBe('');
  });

  it('copies a SCORM package with its current version, units and storage prefix', async () => {
    const { withAssetStorageRollback, transferScormPackageAsset } = await import(
      '@cio/core/services/assets/asset-transfer'
    );
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await withAssetStorageRollback(() =>
        db.transaction(async (tx) => {
          const profileId = crypto.randomUUID();
          const email = `transfer-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
          await tx.insert(schema.user).values({ id: profileId, name: 'Transfer', email });
          const [profile] = await tx
            .insert(schema.profile)
            .values({ id: profileId, fullname: 'Transfer', username: `transfer-${Date.now()}`, email })
            .returning({ id: schema.profile.id });

          const sourceOrg = await createOrganization({ name: `scorm-source-${Date.now()}` }, tx);
          const targetOrg = await createOrganization({ name: `scorm-target-${Date.now()}` }, tx);
          const [source] = await tx
            .insert(schema.asset)
            .values({
              organizationId: sourceOrg.id,
              kind: 'scorm',
              provider: 'upload',
              storageKey: `scorm/source-placeholder`,
              title: 'Safety library'
            })
            .returning();
          await tx
            .update(schema.asset)
            .set({ storageKey: `scorm/${source.id}` })
            .where(eq(schema.asset.id, source.id));

          const [first] = await tx
            .insert(schema.contentPackageVersion)
            .values({
              assetId: source.id,
              versionNumber: 1,
              isCurrent: false,
              status: 'ready',
              format: 'scorm12',
              title: 'Safety library',
              uploadKey: `scorm/${source.id}/v1.zip`,
              contentPrefix: `scorm/${source.id}/v1`
            })
            .returning();
          const [second] = await tx
            .insert(schema.contentPackageVersion)
            .values({
              assetId: source.id,
              versionNumber: 2,
              isCurrent: true,
              status: 'ready',
              format: 'scorm2004_4',
              title: 'Safety library',
              uploadKey: `scorm/${source.id}/v2.zip`,
              contentPrefix: `scorm/${source.id}/v2`
            })
            .returning();
          await tx.insert(schema.contentPackageUnit).values([
            {
              packageVersionId: first.id,
              identifier: 'sco-1',
              title: 'Old module',
              position: 1,
              unitType: 'sco',
              href: 'sco.html',
              masteryScoreRaw: '10'
            },
            {
              packageVersionId: second.id,
              identifier: 'sco-1',
              title: 'New module',
              position: 1,
              unitType: 'sco',
              href: 'sco.html',
              masteryScoreRaw: '70',
              passingScoreScaled: '0.8',
              completionThreshold: '0.6',
              formatDetails: { format: 'scorm2004', maxTimeAllowed: 'PT45M', timeLimitAction: null }
            }
          ]);
          storage.objects.add(`scorm:scorm/${source.id}/v1.zip`);
          storage.objects.add(`scorm:scorm/${source.id}/v1/sco.html`);
          storage.objects.add(`scorm:scorm/${source.id}/v2.zip`);
          storage.objects.add(`scorm:scorm/${source.id}/v2/sco.html`);

          const transfer = await transferScormPackageAsset(source, targetOrg.id, profile.id, tx);

          expect(transfer.asset.id).not.toBe(source.id);
          expect(transfer.replacements).toContainEqual([source.id, transfer.asset.id]);
          expect(transfer.asset).toMatchObject({
            organizationId: targetOrg.id,
            kind: 'scorm',
            storageKey: `scorm/${transfer.asset.id}`
          });

          const versions = await tx
            .select()
            .from(schema.contentPackageVersion)
            .where(eq(schema.contentPackageVersion.assetId, transfer.asset.id));
          expect(versions.map((version) => [version.versionNumber, version.isCurrent, version.status])).toEqual([
            [1, true, 'ready']
          ]);
          expect(versions[0]?.format).toBe('scorm2004_4');

          const units = await tx
            .select({
              identifier: schema.contentPackageUnit.identifier,
              title: schema.contentPackageUnit.title,
              masteryScoreRaw: schema.contentPackageUnit.masteryScoreRaw,
              passingScoreScaled: schema.contentPackageUnit.passingScoreScaled,
              completionThreshold: schema.contentPackageUnit.completionThreshold,
              formatDetails: schema.contentPackageUnit.formatDetails
            })
            .from(schema.contentPackageUnit)
            .innerJoin(
              schema.contentPackageVersion,
              eq(schema.contentPackageUnit.packageVersionId, schema.contentPackageVersion.id)
            )
            .where(eq(schema.contentPackageVersion.assetId, transfer.asset.id));
          expect(units).toHaveLength(1);
          expect(units[0]).toMatchObject({ identifier: 'sco-1', title: 'New module' });
          expect(Number(units[0]?.masteryScoreRaw)).toBe(70);
          expect(Number(units[0]?.passingScoreScaled)).toBeCloseTo(0.8);
          expect(Number(units[0]?.completionThreshold)).toBeCloseTo(0.6);
          expect(units[0]?.formatDetails).toMatchObject({ format: 'scorm2004', maxTimeAllowed: 'PT45M' });

          expect(storage.objects.has(`scorm:scorm/${transfer.asset.id}/v1.zip`)).toBe(true);
          expect(storage.objects.has(`scorm:scorm/${transfer.asset.id}/v1/sco.html`)).toBe(true);

          throw rollback;
        })
      );
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
