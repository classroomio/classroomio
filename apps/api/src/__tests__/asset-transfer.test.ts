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
      ...original.getStorageConfig(),
      bucketVideos: 'videos',
      bucketDocuments: 'documents',
      bucketMedia: 'media'
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
        const [profile] = await tx.select({ id: schema.profile.id }).from(schema.profile).limit(1);
        if (!profile) throw rollback;

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
          const [profile] = await tx.select({ id: schema.profile.id }).from(schema.profile).limit(1);
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
});
