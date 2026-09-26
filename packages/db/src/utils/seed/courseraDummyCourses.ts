import { COURSE_TYPE_VALUES, type TCourseType } from '@cio/utils/constants/course-type';
import { course, courseSection, db, group, groupmember, inArray, lesson } from '@db/drizzle';
import type { TNewCourse, TNewCourseSection, TNewGroup, TNewGroupmember, TNewLesson } from '@db/types';

export const COURSERA_DUMMY_COURSE_COUNT = 40;
const SECTIONS_PER_COURSE = 2;
const LESSONS_PER_SECTION = 2;

function dummyUuid(kind: '1000' | '2000' | '3000' | '4000', index: number) {
  return `7e100000-${kind}-4000-8000-${String(index).padStart(12, '0')}`;
}

function courseIndexRange() {
  return Array.from({ length: COURSERA_DUMMY_COURSE_COUNT }, (_, index) => index + 1);
}

export function courseraDummyGroupId(courseIndex: number) {
  return dummyUuid('1000', courseIndex);
}

export function courseraDummyCourseId(courseIndex: number) {
  return dummyUuid('2000', courseIndex);
}

function sectionIndex(courseIndex: number, sectionOrder: number) {
  return (courseIndex - 1) * SECTIONS_PER_COURSE + sectionOrder;
}

function lessonIndex(courseIndex: number, sectionOrder: number, lessonOrder: number) {
  return (
    (courseIndex - 1) * SECTIONS_PER_COURSE * LESSONS_PER_SECTION +
    (sectionOrder - 1) * LESSONS_PER_SECTION +
    lessonOrder
  );
}

function dummyCourseType(courseIndex: number): TCourseType {
  return COURSE_TYPE_VALUES[(courseIndex - 1) % COURSE_TYPE_VALUES.length];
}

function dummyCourseTitle(courseIndex: number) {
  const padded = String(courseIndex).padStart(2, '0');
  return `Dummy Course ${padded}`;
}

function dummyCourseSlug(courseIndex: number) {
  return `dummy-course-${String(courseIndex).padStart(2, '0')}`;
}

function dummyCreatedAt(courseIndex: number) {
  const day = ((courseIndex - 1) % 28) + 1;
  return `2025-01-${String(day).padStart(2, '0')}T12:00:00.000Z`;
}

export async function seedCourseraDummyCourses({
  enterpriseOrgId,
  enterpriseAdminUserId,
  enterpriseStudentUserId
}: {
  enterpriseOrgId: string;
  enterpriseAdminUserId: string;
  enterpriseStudentUserId: string;
}) {
  const courseIndexes = courseIndexRange();
  const groupIds = courseIndexes.map(courseraDummyGroupId);
  const courseIds = courseIndexes.map(courseraDummyCourseId);
  const sectionIds = courseIndexes.flatMap((courseIndex) =>
    Array.from({ length: SECTIONS_PER_COURSE }, (_, sectionOffset) =>
      dummyUuid('3000', sectionIndex(courseIndex, sectionOffset + 1))
    )
  );
  const lessonIds = courseIndexes.flatMap((courseIndex) =>
    Array.from({ length: SECTIONS_PER_COURSE }, (_, sectionOffset) =>
      Array.from({ length: LESSONS_PER_SECTION }, (_, lessonOffset) =>
        dummyUuid('4000', lessonIndex(courseIndex, sectionOffset + 1, lessonOffset + 1))
      )
    ).flat()
  );

  const existingGroups = await db.select({ id: group.id }).from(group).where(inArray(group.id, groupIds));
  const existingGroupIds = new Set(existingGroups.map((row) => row.id));
  const groupsToInsert: TNewGroup[] = courseIndexes
    .filter((courseIndex) => !existingGroupIds.has(courseraDummyGroupId(courseIndex)))
    .map((courseIndex) => ({
      id: courseraDummyGroupId(courseIndex),
      name: dummyCourseTitle(courseIndex),
      description: `${dummyCourseTitle(courseIndex)} for Coursera Test pagination.`,
      organizationId: enterpriseOrgId
    }));

  if (groupsToInsert.length > 0) {
    await db.insert(group).values(groupsToInsert);
    console.log(`   ✓ Inserted ${groupsToInsert.length} dummy group(s)`);
  } else {
    console.log('   ✓ Dummy groups already exist, skipping');
  }

  const existingMembers = await db
    .select({ groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(inArray(groupmember.groupId, groupIds));
  const existingMemberKeys = new Set(existingMembers.map((row) => `${row.groupId}-${row.profileId}`));
  const membersToInsert: TNewGroupmember[] = courseIndexes.flatMap((courseIndex) => {
    const groupId = courseraDummyGroupId(courseIndex);
    const tutor = {
      groupId,
      roleId: 2,
      profileId: enterpriseAdminUserId,
      email: 'enterprise@test.com'
    };
    const student = {
      groupId,
      roleId: 3,
      profileId: enterpriseStudentUserId
    };

    return [tutor, student].filter((member) => !existingMemberKeys.has(`${member.groupId}-${member.profileId}`));
  });

  if (membersToInsert.length > 0) {
    await db.insert(groupmember).values(membersToInsert);
    console.log(`   ✓ Inserted ${membersToInsert.length} dummy group member(s)`);
  } else {
    console.log('   ✓ Dummy group members already exist, skipping');
  }

  const existingCourses = await db.select({ id: course.id }).from(course).where(inArray(course.id, courseIds));
  const existingCourseIds = new Set(existingCourses.map((row) => row.id));
  const coursesToInsert: TNewCourse[] = courseIndexes
    .filter((courseIndex) => !existingCourseIds.has(courseraDummyCourseId(courseIndex)))
    .map((courseIndex) => ({
      id: courseraDummyCourseId(courseIndex),
      title: dummyCourseTitle(courseIndex),
      description: `${dummyCourseTitle(courseIndex)} is a seed course for list pagination.`,
      overview: 'Welcome to this dummy course.',
      groupId: courseraDummyGroupId(courseIndex),
      isTemplate: false,
      logo: '',
      slug: dummyCourseSlug(courseIndex),
      metadata: {
        goals: '',
        grading: false,
        description: '',
        requirements: '',
        lessonDownload: false,
        allowSelfEnrollment: true
      },
      cost: 0,
      currency: 'USD',
      isPublished: courseIndex % 3 !== 0,
      certificate: {
        isDownloadable: false,
        theme: 'professional'
      },
      status: 'ACTIVE',
      type: dummyCourseType(courseIndex),
      createdAt: dummyCreatedAt(courseIndex),
      updatedAt: dummyCreatedAt(courseIndex)
    }));

  if (coursesToInsert.length > 0) {
    await db.insert(course).values(coursesToInsert);
    console.log(`   ✓ Inserted ${coursesToInsert.length} dummy course(s)`);
  } else {
    console.log('   ✓ Dummy courses already exist, skipping');
  }

  const existingSections = await db
    .select({ id: courseSection.id })
    .from(courseSection)
    .where(inArray(courseSection.id, sectionIds));
  const existingSectionIds = new Set(existingSections.map((row) => row.id));
  const sectionsToInsert: TNewCourseSection[] = courseIndexes.flatMap((courseIndex) =>
    Array.from({ length: SECTIONS_PER_COURSE }, (_, sectionOffset) => {
      const sectionOrder = sectionOffset + 1;
      const id = dummyUuid('3000', sectionIndex(courseIndex, sectionOrder));

      return {
        id,
        courseId: courseraDummyCourseId(courseIndex),
        title: sectionOrder === 1 ? 'Getting started' : 'Next steps',
        order: sectionOrder
      };
    }).filter((section) => !existingSectionIds.has(section.id!))
  );

  if (sectionsToInsert.length > 0) {
    await db.insert(courseSection).values(sectionsToInsert);
    console.log(`   ✓ Inserted ${sectionsToInsert.length} dummy section(s)`);
  } else {
    console.log('   ✓ Dummy sections already exist, skipping');
  }

  const existingLessons = await db.select({ id: lesson.id }).from(lesson).where(inArray(lesson.id, lessonIds));
  const existingLessonIds = new Set(existingLessons.map((row) => row.id));
  const lessonsToInsert: TNewLesson[] = courseIndexes.flatMap((courseIndex) =>
    Array.from({ length: SECTIONS_PER_COURSE }, (_, sectionOffset) => {
      const sectionOrder = sectionOffset + 1;
      const sectionId = dummyUuid('3000', sectionIndex(courseIndex, sectionOrder));

      return Array.from({ length: LESSONS_PER_SECTION }, (_, lessonOffset) => {
        const lessonOrder = lessonOffset + 1;
        const id = dummyUuid('4000', lessonIndex(courseIndex, sectionOrder, lessonOrder));

        return {
          id,
          courseId: courseraDummyCourseId(courseIndex),
          sectionId,
          title: `Lesson ${lessonOrder}`,
          teacherId: enterpriseAdminUserId,
          videos: [],
          isUnlocked: true,
          order: lessonOrder
        };
      });
    })
      .flat()
      .filter((row) => !existingLessonIds.has(row.id!))
  );

  if (lessonsToInsert.length > 0) {
    await db.insert(lesson).values(lessonsToInsert);
    console.log(`   ✓ Inserted ${lessonsToInsert.length} dummy lesson(s)`);
  } else {
    console.log('   ✓ Dummy lessons already exist, skipping');
  }
}
