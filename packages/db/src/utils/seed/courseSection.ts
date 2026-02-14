import { courseSection, db } from '@db/drizzle';

import type { TNewCourseSection } from '@db/types';

export const MVC_SECTION_ID = 'b2c8e7a0-1f3d-4e5a-9b6c-0d1e2f3a4b5c';
export const REACT_SECTION_ID = 'c3d9f8b1-2g4e-5f6b-0c7d-1e2f3a4b5c6d';
export const PANDAS_SECTION_ID = 'd4e0a9c2-3h5f-6g7c-1d8e-2f3a4b5c6d7e';

interface SeedCourseSections {
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
}

export async function seedCourseSections({ mvcCourseId, reactCourseId, pandasCourseId }: SeedCourseSections) {
  const existingSections = await db.select().from(courseSection);
  const existingSectionIds = new Set(existingSections.map((s) => s.id));

  const sectionsToInsert: TNewCourseSection[] = [
    {
      id: MVC_SECTION_ID,
      courseId: mvcCourseId,
      title: 'Getting Started',
      order: 0
    },
    {
      id: REACT_SECTION_ID,
      courseId: reactCourseId,
      title: 'Core Concepts',
      order: 0
    },
    {
      id: PANDAS_SECTION_ID,
      courseId: pandasCourseId,
      title: 'Foundations',
      order: 0
    }
  ].filter((s) => !existingSectionIds.has(s.id!));

  if (sectionsToInsert.length > 0) {
    await db.insert(courseSection).values(sectionsToInsert);
    console.log(`   ✓ Inserted ${sectionsToInsert.length} course section(s)`);
  } else {
    console.log('   ✓ Course sections already exist, skipping');
  }
}
