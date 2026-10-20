import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { createAssetUsage, getAssetById } from '@cio/db/queries/assets';
import { getCurrentPackageVersion } from '@cio/db/queries/activity/package-version';
import { createActivities } from '@cio/db/queries/activity';
import { createCourse as createCourseQuery, createCourseNewsfeed, isCourseSlugTaken } from '@cio/db/queries/course';
import { addGroupMember, createGroup } from '@cio/db/queries/group';
import { upsertActivityScorm } from '@cio/db/queries/scorm';
import type { TAsset, TContentPackageVersion, TCourse } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import { ACTIVITY_PACKAGE_SLOT } from '@cio/utils/validation/assets/assets';
import type { TActivityCoursesCreate } from '@cio/utils/validation/activity/course';
import { slugifyTitle } from '@cio/utils/validation';

import { sanitizeHtml } from '../../utils/sanitize-html';
import { invalidateOrgStats } from '../../utils/redis/org-stats-cache';
import { generateUniqueCourseSlug } from '../course/landing-page';
import { resolveItemSlug } from '../course/slug';

export interface CreatedPackageCourse {
  id: string;
  title: string;
  slug: string | null;
  activityId: string;
  assetId: string;
}

type ReadyPackage = {
  asset: TAsset;
  version: TContentPackageVersion;
  title: string;
};

/**
 * Creates one draft SCORM course per package, each with its package attached.
 * Every package is checked before anything is created, and all courses are
 * created in a single transaction, so the request fails without creating
 * anything when a package is foreign, has no ready version, or any course
 * write fails partway through.
 */
export async function createCoursesFromPackages(
  organizationId: string,
  profileId: string,
  input: TActivityCoursesCreate
): Promise<CreatedPackageCourse[]> {
  const packages: ReadyPackage[] = [];

  for (const assetId of input.assetIds) {
    const asset = await getAssetById(assetId, organizationId);
    if (!asset || asset.kind !== 'scorm') throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);

    const version = await getCurrentPackageVersion(asset.id);
    if (!version || version.status !== 'ready')
      throw new AppError('Package has no ready version yet', ErrorCodes.VALIDATION_ERROR, 400);

    const title = input.titles?.[assetId]?.trim() || version.title?.trim() || asset.title?.trim() || 'Untitled course';
    packages.push({ asset, version, title });
  }

  const seenSlugs = new Set<string>();
  const slugs: string[] = [];
  for (const ready of packages) {
    const baseSlug = slugifyTitle(ready.title);
    let candidate = baseSlug;
    let suffix = 0;
    while (seenSlugs.has(candidate) || (await isCourseSlugTaken(candidate))) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
    seenSlugs.add(candidate);
    slugs.push(candidate);
  }

  const created = await db.transaction(async (tx) => {
    const rows: CreatedPackageCourse[] = [];
    for (const [index, ready] of packages.entries()) {
      rows.push(
        await createPackageCourse(organizationId, profileId, input.courseType, ready, slugs[index] as string, tx)
      );
    }
    return rows;
  });

  await invalidateOrgStats(organizationId);

  return created;
}

async function createPackageCourse(
  organizationId: string,
  profileId: string,
  courseType: TActivityCoursesCreate['courseType'],
  ready: ReadyPackage,
  slug: string,
  tx: DbOrTxClient
): Promise<CreatedPackageCourse> {
  const description = sanitizeHtml(ready.asset.description?.trim() || ready.title);
  const [newGroup] = await createGroup({ name: ready.title, description, organizationId }, tx);
  if (!newGroup) throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);

  const [newCourse] = await createCourseQuery(
    {
      title: ready.title,
      description,
      type: courseType ?? 'SELF_PACED',
      format: 'single_activity',
      groupId: newGroup.id,
      slug,
      isPublished: false,
      status: 'ACTIVE'
    },
    tx
  );
  if (!newCourse) throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);

  const [newMember] = await addGroupMember({ profileId, groupId: newGroup.id, roleId: ROLE.TUTOR }, tx);
  if (!newMember) throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);

  const newsfeedContent = sanitizeHtml(`<h2>Welcome to this course 🎉&nbsp;</h2>
<p>Thank you for joining this course and I hope you get the best out of it.</p>`);
  await createCourseNewsfeed(
    {
      content: newsfeedContent,
      courseId: newCourse.id,
      isPinned: true,
      authorId: newMember.id
    },
    tx
  );

  const activity = await createCourseActivity(newCourse, ready.title, profileId, tx);
  const sequenced = ((ready.version.warnings ?? []) as string[]).includes('has_sequencing');
  await upsertActivityScorm(
    { activityId: activity.id, assetId: ready.asset.id, moduleOrder: sequenced ? 'sequential' : 'free' },
    tx
  );
  await createAssetUsage(
    {
      organizationId,
      assetId: ready.asset.id,
      targetType: 'activity',
      targetId: activity.id,
      slotType: ACTIVITY_PACKAGE_SLOT,
      createdByProfileId: profileId
    },
    tx
  );

  return {
    id: newCourse.id,
    title: newCourse.title,
    slug: newCourse.slug,
    activityId: activity.id,
    assetId: ready.asset.id
  };
}

async function createCourseActivity(course: TCourse, title: string, profileId: string, tx: DbOrTxClient) {
  const slug = await resolveItemSlug({ courseId: course.id, title });
  const [activity] = await createActivities(
    [
      {
        courseId: course.id,
        sectionId: null,
        kind: 'scorm',
        title,
        slug,
        order: 1,
        createdByProfileId: profileId
      }
    ],
    tx
  );
  if (!activity) throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);

  return activity;
}
