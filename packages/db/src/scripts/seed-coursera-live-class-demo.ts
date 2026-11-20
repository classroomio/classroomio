import 'dotenv/config';

import { and, course, courseSection, db, eq, groupmember, lesson, profile } from '@db/drizzle';
import { courseraDummyCourseId, courseraDummyGroupId } from '@db/utils/seed/courseraDummyCourses';

const LIVE_COURSE_INDEX = 2;
const COURSE_ID = courseraDummyCourseId(LIVE_COURSE_INDEX);
const GROUP_ID = courseraDummyGroupId(LIVE_COURSE_INDEX);
const SESSION_TIMEZONE = 'Africa/Lagos';
const SESSION_TIMEZONE_UTC_OFFSET_HOURS = 1;
const DEMO_STUDENT_EMAIL = 'grading-student@test.com';
const ROLE_STUDENT = 3;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const SECTIONS = [
  { id: '7e100000-3000-4000-8000-000000000003', title: 'Month 1', order: 1 },
  { id: '7e100000-3000-4000-8000-000000000004', title: 'Month 2', order: 2 }
] as const;

type DemoSession = {
  id: string;
  title: string;
  sectionId: string;
  order: number;
  startsAt: (now: Date) => Date;
  durationMinutes: number;
  callUrl: string;
  recordingUrl: string | null;
};

function startOfMinute(date: Date) {
  return new Date(Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS);
}

function tomorrowAtTenInSessionTimezone(now: Date) {
  const tomorrow = new Date(now.getTime() + DAY_MS);

  return new Date(
    Date.UTC(
      tomorrow.getUTCFullYear(),
      tomorrow.getUTCMonth(),
      tomorrow.getUTCDate(),
      10 - SESSION_TIMEZONE_UTC_OFFSET_HOURS
    )
  );
}

const SESSIONS: DemoSession[] = [
  {
    id: '7e100000-4000-4000-8000-000000000005',
    title: 'Kickoff: Course orientation',
    sectionId: SECTIONS[0].id,
    order: 1,
    startsAt: (now) => startOfMinute(new Date(now.getTime() - 6 * DAY_MS)),
    durationMinutes: 60,
    callUrl: 'https://zoom.us/j/81234567890',
    recordingUrl: 'https://zoom.us/rec/share/kickoff-orientation'
  },
  {
    id: '7e100000-4000-4000-8000-000000000006',
    title: 'Week 2: Live Q&A',
    sectionId: SECTIONS[0].id,
    order: 2,
    startsAt: (now) => startOfMinute(new Date(now.getTime() - 4 * DAY_MS)),
    durationMinutes: 90,
    callUrl: 'https://zoom.us/j/81234567891',
    recordingUrl: 'https://zoom.us/rec/share/week-2-live-qa'
  },
  {
    id: '7e100000-4000-4000-8000-000000000007',
    title: 'Week 3: Feedback workshop',
    sectionId: SECTIONS[1].id,
    order: 1,
    startsAt: (now) => startOfMinute(new Date(now.getTime() - 5 * MINUTE_MS)),
    durationMinutes: 180,
    callUrl: 'https://zoom.us/j/81234567892',
    recordingUrl: null
  },
  {
    id: '7e100000-4000-4000-8000-000000000008',
    title: 'Week 4: Office hours',
    sectionId: SECTIONS[1].id,
    order: 2,
    startsAt: tomorrowAtTenInSessionTimezone,
    durationMinutes: 45,
    callUrl: 'https://zoom.us/j/81234567893',
    recordingUrl: null
  }
];

async function shapeCourse() {
  const [existing] = await db.select({ metadata: course.metadata }).from(course).where(eq(course.id, COURSE_ID));
  if (!existing) throw new Error('Dummy Course 02 is missing; run the base seed first');

  const metadata = {
    ...(existing.metadata as Record<string, unknown>),
    sessionTimezone: SESSION_TIMEZONE,
    isContentGroupingEnabled: true
  };

  await db
    .update(course)
    .set({
      title: 'Live Leadership Cohort',
      description: 'A four-week live cohort for new team leads, with a weekly session and recordings of each one.',
      type: 'LIVE_CLASS',
      isPublished: true,
      metadata
    })
    .where(eq(course.id, COURSE_ID));

  for (const section of SECTIONS) {
    await db
      .update(courseSection)
      .set({ title: section.title, order: section.order })
      .where(eq(courseSection.id, section.id));
  }
}

async function scheduleSessions(now: Date) {
  for (const session of SESSIONS) {
    const startsAt = session.startsAt(now);

    await db
      .update(lesson)
      .set({
        title: session.title,
        sectionId: session.sectionId,
        order: session.order,
        lessonAt: startsAt.toISOString(),
        sessionDurationMinutes: session.durationMinutes,
        callUrl: session.callUrl,
        recordingUrl: session.recordingUrl,
        isUnlocked: true
      })
      .where(eq(lesson.id, session.id));

    console.log(`   ✓ ${session.title}: ${startsAt.toISOString()} for ${session.durationMinutes} min`);
  }
}

async function enrolDemoStudent() {
  const [demoStudent] = await db.select({ id: profile.id }).from(profile).where(eq(profile.email, DEMO_STUDENT_EMAIL));
  if (!demoStudent) return;

  const [existing] = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(and(eq(groupmember.groupId, GROUP_ID), eq(groupmember.profileId, demoStudent.id)));
  if (existing) return;

  await db.insert(groupmember).values({ groupId: GROUP_ID, profileId: demoStudent.id, roleId: ROLE_STUDENT });
  console.log(`   ✓ Enrolled ${DEMO_STUDENT_EMAIL}`);
}

async function main() {
  console.log('🌱 Seeding the coursera-test live class demo...');

  const now = new Date();

  await shapeCourse();
  await scheduleSessions(now);
  await enrolDemoStudent();

  console.log(`✅ Done. Course: /courses/${COURSE_ID}/lessons`);
  process.exit(0);
}

main().catch((error) => {
  console.error('seed-coursera-live-class-demo error:', error);
  process.exit(1);
});
