import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { courseRouter } from '@api/routes/course/course';
import { cloneCourse, syncLessonAssetUsages } from '@api/services/course/clone';
import { convertCourseToTemplate } from '@api/services/course/course-template';
import { pullCourseTemplateUpdates } from '@api/services/course/template-sync';
import { Hono } from '@api/utils/hono';
import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';
import { launchTemplateFixtures } from '@db/utils/seed/platform-templates/fixtures';

import type { Context, Next } from 'hono';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function appAs(orgId: string, roleId: number) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: USER_ID });
    c.set('session', { id: 'session' });
    c.set('orgRoles', { [orgId]: roleId });
    await next();
  };

  return new Hono().use(setContext).route('/course', courseRouter);
}

describe('course template route access', () => {
  it('rejects template mutations from a tutor', async () => {
    const app = appAs(ORG_ID, ROLE.TUTOR);
    const response = await app.request(`/course/${ORG_ID}/template`, {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Saved template' })
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.ORG_TEAM_NOT_AUTHORIZED);
  });

  it('rejects template list and preview for a student', async () => {
    const app = appAs(ORG_ID, ROLE.STUDENT);
    const list = await app.request(`/course/template?organizationId=${ORG_ID}`, {
      headers: { 'cio-org-id': ORG_ID }
    });
    const preview = await app.request(`/course/template/${ORG_ID}/preview?organizationId=${ORG_ID}`, {
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(list.status).toBe(403);
    expect(preview.status).toBe(403);
  });
});

describe.skipIf(!hasDatabase)('course template database integrity', () => {
  it('reads the course id on a template action', async () => {
    const app = appAs(ORG_ID, ROLE.ADMIN);
    const response = await app.request(`/course/${ORG_ID}/template/convert`, {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(404);
  });

  it('seeds each launch template once and keeps it after the slug changes', async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const { createGroup } = await import('@db/queries/group');
    const { createCourse, getCourseBySeedKey } = await import('@db/queries/course');
    const { seedLaunchTemplates } = await import('@db/utils/seed/platform-templates/insert');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await db.transaction(async (tx) => {
        await tx
          .insert(schema.questionType)
          .values(Object.values(QUESTION_TYPE).map((id) => ({ id, label: `type-${id}` })))
          .onConflictDoNothing();

        const organization = await createOrganization({ name: `tpl-seed-${Date.now()}` }, tx);
        const blocker = await createOrganization({ name: `tpl-blocker-${Date.now()}` }, tx);
        const keys = launchTemplateFixtures.map((fixture) => fixture.slug);
        const before = await tx
          .select({ seedKey: schema.course.seedKey })
          .from(schema.course)
          .where(inArray(schema.course.seedKey, keys));
        const present = new Set(before.map((row) => row.seedKey));
        const missing = launchTemplateFixtures.filter((fixture) => !present.has(fixture.slug));
        const blocked = missing[0];

        if (blocked) {
          const [group] = await createGroup({ name: blocked.title, organizationId: blocker.id }, tx);
          await createCourse(
            {
              title: blocked.title,
              description: blocked.description,
              slug: blocked.slug,
              groupId: group.id
            },
            tx
          );
        }

        await seedLaunchTemplates(organization.id, tx);
        await seedLaunchTemplates(organization.id, tx);

        const owned = await tx
          .select({ id: schema.course.id, slug: schema.course.slug, seedKey: schema.course.seedKey })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .where(eq(schema.group.organizationId, organization.id));

        expect(owned).toHaveLength(missing.length);
        expect(new Set(owned.map((row) => row.seedKey))).toEqual(new Set(missing.map((fixture) => fixture.slug)));

        if (blocked) {
          const seeded = owned.find((row) => row.seedKey === blocked.slug);
          expect(seeded?.slug).not.toBe(blocked.slug);
        }

        const renamed = owned[0];
        if (renamed) {
          await tx
            .update(schema.course)
            .set({ slug: `renamed-${renamed.id}` })
            .where(eq(schema.course.id, renamed.id));
          await seedLaunchTemplates(organization.id, tx);
          const again = await getCourseBySeedKey(renamed.seedKey!, tx);
          expect(again?.id).toBe(renamed.id);
          expect(again?.slug).toBe(`renamed-${renamed.id}`);
        }

        const after = await tx
          .select({ seedKey: schema.course.seedKey })
          .from(schema.course)
          .where(inArray(schema.course.seedKey, keys));
        expect(after).toHaveLength(keys.length);

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it('records youtube lesson videos as assets in the org a template is used in', async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await db.transaction(async (tx) => {
        const [profile] = await tx.select({ id: schema.profile.id }).from(schema.profile).limit(1);
        if (!profile) throw rollback;

        const templateOrg = await createOrganization({ name: `tpl-yt-source-${Date.now()}` }, tx);
        const courseOrg = await createOrganization({ name: `tpl-yt-target-${Date.now()}` }, tx);
        const sourceUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const [sourceAsset] = await tx
          .insert(schema.asset)
          .values({
            organizationId: templateOrg.id,
            kind: 'video',
            provider: 'youtube',
            storageProvider: 'external',
            sourceUrl,
            isExternal: true,
            title: 'Intro video'
          })
          .returning();
        const [group] = await tx
          .insert(schema.group)
          .values({ name: 'YouTube template', organizationId: templateOrg.id })
          .returning();
        const [template] = await tx
          .insert(schema.course)
          .values({
            title: 'YouTube template',
            description: 'Template with a video',
            groupId: group.id,
            isTemplate: true,
            slug: `yt-template-${templateOrg.id}`
          })
          .returning();
        await tx.insert(schema.lesson).values({
          courseId: template.id,
          title: 'Watch this',
          order: 1,
          videos: [{ type: 'youtube', link: sourceUrl, assetId: sourceAsset.id, fileName: 'Intro video' }]
        });

        const cloneOptions = { title: 'From template', userId: profile.id, organizationId: courseOrg.id };
        const first = await cloneCourse(template.id, { ...cloneOptions, slug: `yt-first-${courseOrg.id}` }, tx);
        const second = await cloneCourse(template.id, { ...cloneOptions, slug: `yt-second-${courseOrg.id}` }, tx);

        const targetAssets = await tx.select().from(schema.asset).where(eq(schema.asset.organizationId, courseOrg.id));
        expect(targetAssets).toHaveLength(1);
        expect(targetAssets[0].sourceUrl).toBe(sourceUrl);

        const clonedLessons = await tx
          .select({ id: schema.lesson.id, videos: schema.lesson.videos })
          .from(schema.lesson)
          .where(inArray(schema.lesson.courseId, [first.id, second.id]));
        expect(clonedLessons).toHaveLength(2);
        for (const lesson of clonedLessons) {
          expect(lesson.videos?.[0]?.assetId).toBe(targetAssets[0].id);
        }

        const usages = await tx
          .select()
          .from(schema.assetUsage)
          .where(eq(schema.assetUsage.assetId, targetAssets[0].id));
        expect(usages.map((usage) => usage.targetId).sort()).toEqual(clonedLessons.map((lesson) => lesson.id).sort());
        expect(usages.every((usage) => usage.slotType === 'lesson_video' && usage.targetType === 'lesson')).toBe(true);

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it('moves lesson media usages to the assets a pulled lesson now uses', async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await db.transaction(async (tx) => {
        const [profile] = await tx.select({ id: schema.profile.id }).from(schema.profile).limit(1);
        if (!profile) throw rollback;

        const organization = await createOrganization({ name: `tpl-usage-${Date.now()}` }, tx);
        const [removedVideo, keptVideo, bannerAsset] = await tx
          .insert(schema.asset)
          .values([
            { organizationId: organization.id, kind: 'video', provider: 'youtube', title: 'Removed' },
            { organizationId: organization.id, kind: 'video', provider: 'youtube', title: 'Kept' },
            { organizationId: organization.id, kind: 'image', title: 'Banner' }
          ])
          .returning();
        const lessonId = crypto.randomUUID();
        await tx.insert(schema.assetUsage).values({
          organizationId: organization.id,
          assetId: bannerAsset.id,
          targetType: 'lesson',
          targetId: lessonId,
          slotType: 'lesson_cover'
        });

        const oldVideos = [{ type: 'youtube' as const, link: 'https://youtu.be/a', assetId: removedVideo.id }];
        const newVideos = [{ type: 'youtube' as const, link: 'https://youtu.be/b', assetId: keptVideo.id }];
        await syncLessonAssetUsages(
          [{ id: lessonId, videos: oldVideos, documents: [] }],
          organization.id,
          profile.id,
          tx
        );
        await syncLessonAssetUsages(
          [{ id: lessonId, videos: newVideos, documents: [] }],
          organization.id,
          profile.id,
          tx
        );

        const usages = await tx
          .select({ assetId: schema.assetUsage.assetId, slotType: schema.assetUsage.slotType })
          .from(schema.assetUsage)
          .where(eq(schema.assetUsage.targetId, lessonId));
        expect(usages).toHaveLength(2);
        expect(usages).toEqual(
          expect.arrayContaining([
            { assetId: keptVideo.id, slotType: 'lesson_video' },
            { assetId: bannerAsset.id, slotType: 'lesson_cover' }
          ])
        );

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it('keeps thumbnail prefixes another asset still displays', async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const { assetLocationsReferencedElsewhere } = await import('@db/queries/assets');
    const schema = await import('@db/schema');

    const rollback = new Error('rollback');
    try {
      await db.transaction(async (tx) => {
        const organization = await createOrganization({ name: `tpl-asset-${Date.now()}` }, tx);
        const [source] = await tx
          .insert(schema.asset)
          .values({ organizationId: organization.id, title: 'source' })
          .returning();
        const prefix = `thumbnails/${source.id}/`;
        await tx.insert(schema.asset).values({
          organizationId: organization.id,
          title: 'copy',
          thumbnailUrl: `https://cdn.example/${prefix}poster.jpg`,
          thumbnailCandidates: [`https://cdn.example/${prefix}candidate.jpg`]
        });

        const shared = await assetLocationsReferencedElsewhere(source.id, [], [prefix], tx);
        expect(shared.prefixes.has(prefix)).toBe(true);

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it('rolls back a pull that fails after writing', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const past = '2020-01-01T00:00:00.000Z';
    const current = '2026-01-01T00:00:00.000Z';
    const organization = await db
      .insert(schema.organization)
      .values({ name: `tpl-pull-${Date.now()}` })
      .returning();
    const orgId = organization[0].id;
    const courseIds: string[] = [];

    try {
      const [group] = await db.insert(schema.group).values({ name: 'Pull', organizationId: orgId }).returning();
      const [template] = await db
        .insert(schema.course)
        .values({
          title: 'Template',
          description: 'Template',
          groupId: group.id,
          isTemplate: true,
          status: 'ACTIVE',
          createdAt: past
        })
        .returning();
      const [course] = await db
        .insert(schema.course)
        .values({
          title: 'Course',
          description: 'Course',
          groupId: group.id,
          templateId: template.id,
          status: 'ACTIVE',
          createdAt: past
        })
        .returning();
      courseIds.push(template.id, course.id);

      const [templateSection] = await db
        .insert(schema.courseSection)
        .values({ title: 'Updated section', order: 1, courseId: template.id, updatedAt: current, createdAt: past })
        .returning();
      const [courseSection] = await db
        .insert(schema.courseSection)
        .values({
          title: 'Old section',
          order: 1,
          courseId: course.id,
          sourceId: templateSection.id,
          sourceSyncedAt: past,
          updatedAt: past,
          createdAt: past
        })
        .returning();
      const [other] = await db
        .insert(schema.course)
        .values({ title: 'Other', description: 'Other', groupId: group.id, status: 'ACTIVE' })
        .returning();
      courseIds.push(other.id);
      const [foreignSection] = await db
        .insert(schema.courseSection)
        .values({ title: 'Elsewhere', order: 1, courseId: other.id })
        .returning();
      const [lesson] = await db
        .insert(schema.lesson)
        .values({
          title: 'New lesson',
          courseId: template.id,
          order: 1,
          sectionId: foreignSection.id,
          createdAt: current,
          updatedAt: current
        })
        .returning();

      const courseQueries = await import('@db/queries/course');
      const updateSection = vi.spyOn(courseQueries, 'updateCourseSection');
      await expect(
        pullCourseTemplateUpdates(course.id, orgId, USER_ID, [templateSection.id, lesson.id], [])
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(updateSection).toHaveBeenCalled();
      updateSection.mockRestore();

      const [unchanged] = await db
        .select({ title: schema.courseSection.title })
        .from(schema.courseSection)
        .where(eq(schema.courseSection.id, courseSection.id));
      expect(unchanged.title).toBe('Old section');
    } finally {
      if (courseIds.length > 0) {
        await db.delete(schema.lesson).where(inArray(schema.lesson.courseId, courseIds));
        await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
      }
      await db.delete(schema.group).where(eq(schema.group.organizationId, orgId));
      await db.delete(schema.organization).where(eq(schema.organization.id, orgId));
    }
  });

  it('stops a free org on its second template and rejects cloning one', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const organization = await db
      .insert(schema.organization)
      .values({ name: `tpl-limit-${Date.now()}` })
      .returning();
    const orgId = organization[0].id;
    const courseIds: string[] = [];

    try {
      const [group] = await db.insert(schema.group).values({ name: 'Limit', organizationId: orgId }).returning();
      const [template] = await db
        .insert(schema.course)
        .values({
          title: 'Existing template',
          description: 'Existing',
          groupId: group.id,
          isTemplate: true,
          slug: `existing-template-${orgId}`
        })
        .returning();
      const [course] = await db
        .insert(schema.course)
        .values({
          title: 'Live course',
          description: 'Live',
          groupId: group.id,
          slug: `live-course-${orgId}`
        })
        .returning();
      courseIds.push(template.id, course.id);

      await expect(convertCourseToTemplate(course.id, orgId)).rejects.toMatchObject({
        code: ErrorCodes.UPGRADE_REQUIRED,
        statusCode: 403
      });
      const [stillCourse] = await db
        .select({ isTemplate: schema.course.isTemplate })
        .from(schema.course)
        .where(eq(schema.course.id, course.id));
      expect(stillCourse.isTemplate).toBe(false);

      const admin = appAs(orgId, ROLE.ADMIN);
      const clone = await admin.request(`/course/${template.id}/clone`, {
        method: 'POST',
        headers: { 'cio-org-id': orgId, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Clone',
          slug: `clone-${orgId}`,
          organizationId: orgId
        })
      });
      expect(clone.status).toBe(403);

      const outsider = appAs(OTHER_ORG_ID, ROLE.ADMIN);
      const foreign = await outsider.request(`/course/${template.id}/clone`, {
        method: 'POST',
        headers: { 'cio-org-id': OTHER_ORG_ID, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Clone',
          slug: `foreign-${orgId}`,
          organizationId: OTHER_ORG_ID
        })
      });
      expect(foreign.status).toBe(404);

      const tutor = appAs(orgId, ROLE.TUTOR);
      const list = await tutor.request(`/course/template?organizationId=${orgId}`, {
        headers: { 'cio-org-id': orgId }
      });
      expect(list.status).toBe(200);
    } finally {
      if (courseIds.length > 0) {
        await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
      }
      await db.delete(schema.group).where(eq(schema.group.organizationId, orgId));
      await db.delete(schema.organization).where(eq(schema.organization.id, orgId));
    }
  });
});
