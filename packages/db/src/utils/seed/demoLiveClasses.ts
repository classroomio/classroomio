import { db, lessonSessionRegistration } from '@db/drizzle';

import { demoLessonId, minutesFromNow, type DemoCourse } from './demoCatalogTypes';
import { DEMO_CATALOG } from './demoCourses';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

type DemoRegistration = {
  courseKey: string;
  sectionIndex: number;
  lessonIndex: number;
  personKeys: string[];
};

/**
 * student@test.com is registered for the Leading Teams session that starts minutes after seeding and for the next
 * Product Management session. The Docker and Productivity sessions are in courses the student is not in.
 */
const REGISTRATIONS: DemoRegistration[] = [
  {
    courseKey: 'leading-teams',
    sectionIndex: 0,
    lessonIndex: 1,
    personKeys: ['student', 'tomas.rivera', 'emily.carter', 'kenji.watanabe', 'aisha.bello', 'daniel.mensah']
  },
  {
    courseKey: 'product-management',
    sectionIndex: 1,
    lessonIndex: 0,
    personKeys: [
      'student',
      'priya.raman',
      'aisha.bello',
      'kwame.asante',
      'hannah.becker',
      'emily.carter',
      'rafael.costa'
    ]
  },
  {
    courseKey: 'product-management',
    sectionIndex: 1,
    lessonIndex: 1,
    personKeys: ['priya.raman', 'marcus.johnson', 'tomas.rivera']
  },
  {
    courseKey: 'leading-teams',
    sectionIndex: 1,
    lessonIndex: 0,
    personKeys: ['tomas.rivera', 'olga.petrova', 'marcus.johnson']
  },
  {
    courseKey: 'docker',
    sectionIndex: 1,
    lessonIndex: 2,
    personKeys: ['fatima.alsayed', 'olga.petrova', 'kenji.watanabe', 'daniel.mensah']
  },
  {
    courseKey: 'productivity',
    sectionIndex: 1,
    lessonIndex: 2,
    personKeys: ['emily.carter', 'zanele.dlamini', 'nadia.haddad']
  }
];

export async function seedDemoLiveClasses({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const personId = buildPeopleDirectory(accounts);
  const courseByKey = new Map<string, DemoCourse>(DEMO_CATALOG.map((demoCourse) => [demoCourse.key, demoCourse]));

  const rows = REGISTRATIONS.flatMap((registration) => {
    const demoCourse = courseByKey.get(registration.courseKey);
    if (!demoCourse) throw new Error(`Unknown demo course ${registration.courseKey}`);

    const live = demoCourse.sections[registration.sectionIndex]?.lessons[registration.lessonIndex]?.live;
    if (!live) throw new Error(`${registration.courseKey} lesson is not a live class`);

    const lessonId = demoLessonId(demoCourse, registration.sectionIndex, registration.lessonIndex);

    return registration.personKeys.map((personKey, position) => ({
      lessonId,
      profileId: personId(personKey),
      createdAt: minutesFromNow(now, -60 * (position + 2))
    }));
  });

  const inserted = await db
    .insert(lessonSessionRegistration)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: lessonSessionRegistration.id });

  console.log(`   ✓ Demo live classes: ${inserted.length} registration(s)`);
}
