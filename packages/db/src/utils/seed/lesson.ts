import { db, lesson } from '@db/drizzle';

interface LessonTemplate {
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
  adminUserId: string;
}

const VIDEO_TYPE = 'youtube' as const;

export async function seedLessons({ mvcCourseId, adminUserId, reactCourseId, pandasCourseId }: LessonTemplate) {
  const existingLessons = await db.select().from(lesson);
  const existingLessonIds = existingLessons.map((l) => l.id);

  const lessonsToInsert = [
    // MVC Course lessons
    {
      id: '5c75f4f1-c222-44a9-a8c6-81773ea33872',
      courseId: mvcCourseId,
      title: 'Lesson 1: Introduction to MVC Architecture',
      teacherId: adminUserId,
      videos: [{ link: 'https://youtu.be/pXLWqkA87e4?si=rUHaBMnuFgAMjm2T', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    {
      id: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
      courseId: mvcCourseId,
      title: 'Anatomy of MVC Components',
      teacherId: adminUserId,
      videos: [{ link: 'https://youtu.be/4Qfk8MhtZJU?si=VZ7cF-pjvm_RmFMp', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    {
      id: '266b3daa-1eb2-401e-9510-1819952b44b7',
      courseId: mvcCourseId,
      title: 'Building Your First MVC Application',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=EMwu8F0dCXE', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    // React Course lessons
    {
      id: '6f2d8142-0903-425c-8534-f5105b624752',
      courseId: reactCourseId,
      title: 'Introduction to React: Understanding the Basics',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    {
      id: '0a39ab2f-9451-4a90-902c-3030bf965637',
      courseId: reactCourseId,
      title: 'Components and Props: Building Reusable UI Elements',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    {
      id: '80b79665-733b-41bf-9853-34fd8ab50496',
      courseId: reactCourseId,
      title: 'State and Lifecycle: Managing Data in React Applications',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=DveeFlWzWzc', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false
    },
    // Pandas Course lessons
    {
      id: '5e5c8221-4c11-4c40-8664-11743bb79579',
      courseId: pandasCourseId,
      title: 'Python Essentials: An Introduction to Data Science',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true
    },
    {
      id: '829da386-8ccd-4c81-b2fb-b9891102c83c',
      courseId: pandasCourseId,
      title: 'Delving into Data Analysis with Pandas',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true
    },
    {
      id: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1',
      courseId: pandasCourseId,
      title: 'Data Cleaning and Preprocessing Techniques',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=LI7s_lyooO8', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true
    }
  ].filter((l) => !existingLessonIds.includes(l.id));

  if (lessonsToInsert.length > 0) {
    await db.insert(lesson).values(lessonsToInsert);
    console.log(`   ✓ Inserted ${lessonsToInsert.length} lesson(s)`);
  } else {
    console.log('   ✓ Lessons already exist, skipping');
  }
}
