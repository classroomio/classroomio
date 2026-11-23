import { asset, course, db, eq, lesson, lessonVideoProgress, sql } from '@db/drizzle';

import { demoCourseId, demoId, demoLessonId, minutesFromNow, type DemoCourse } from './demoCatalogTypes';
import { DEMO_CATALOG } from './demoCourses';
import type { DemoAccounts } from './demoPeople';

const VIDEO_SECONDS = 1500;
const WATCHED_SECONDS = 610;

function courseByKey(key: string): DemoCourse {
  const demoCourse = DEMO_CATALOG.find((candidate) => candidate.key === key);
  if (!demoCourse) throw new Error(`Unknown demo course ${key}`);

  return demoCourse;
}

/**
 * Turns UX Design into a sequential course whose fourth lesson completes from watching its video. The video is an
 * uploaded-style asset that streams from its source URL, so it needs no object storage.
 */
export async function seedDemoProgression({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const uxDesign = courseByKey('ux-design');
  const watchLesson = uxDesign.sections[1].lessons[0];
  const video = watchLesson.video;
  if (!video) throw new Error('UX Design lesson 4 needs a video for the watch rule');

  const courseId = demoCourseId(uxDesign);
  const lessonId = demoLessonId(uxDesign, 1, 0);
  const assetId = demoId('a000', uxDesign.index, 1);

  await db
    .update(course)
    .set({ metadata: sql`${course.metadata} || ${JSON.stringify({ progressionMode: 'sequential' })}::jsonb` })
    .where(eq(course.id, courseId));

  await db
    .insert(asset)
    .values({
      id: assetId,
      organizationId: accounts.udemyOrgId,
      kind: 'video',
      provider: 'upload',
      sourceUrl: video.link,
      mimeType: 'video/mp4',
      title: video.title,
      durationSeconds: VIDEO_SECONDS,
      createdByProfileId: accounts.admin
    })
    .onConflictDoNothing();

  await db
    .update(lesson)
    .set({
      videos: [{ type: 'upload', link: video.link, assetId, fileName: video.title, metadata: { title: video.title } }],
      completionPolicy: 'video_watch',
      videoWatchThreshold: 90
    })
    .where(eq(lesson.id, lessonId));

  const watchedAt = minutesFromNow(now, -60 * 26);
  await db
    .insert(lessonVideoProgress)
    .values({
      lessonId,
      profileId: accounts.student,
      assetId,
      durationSeconds: VIDEO_SECONDS,
      watchedSeconds: WATCHED_SECONDS,
      furthestSeconds: WATCHED_SECONDS + 12,
      lastPositionSeconds: WATCHED_SECONDS + 5,
      createdAt: watchedAt,
      updatedAt: watchedAt
    })
    .onConflictDoNothing();

  console.log('   ✓ Demo progression: UX Design is sequential, with a watch-to-complete video on its fourth lesson');
}
