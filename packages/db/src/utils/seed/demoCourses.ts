import {
  course,
  courseSection,
  db,
  eq,
  exercise,
  group,
  groupmember,
  inArray,
  lesson,
  lessonLanguage,
  question
} from '@db/drizzle';
import { createOptions, createQuestions } from '@db/queries/exercise/exercise';
import type {
  TNewCourse,
  TNewCourseSection,
  TNewExercise,
  TNewGroup,
  TNewGroupmember,
  TNewLesson,
  TNewOption,
  TNewQuestion
} from '@db/types';
import { ROLE } from '@cio/utils/constants/roles';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';

import { COURSERA_COURSES, SKILLSHARE_COURSES } from './demoCatalogPartners';
import {
  daysFromNow,
  demoCourseId,
  demoExerciseId,
  demoGroupId,
  demoLessonId,
  demoSectionId,
  minutesFromNow,
  renderLessonHtml,
  slugify,
  type DemoCourse,
  type DemoLesson,
  type DemoOrgKey,
  type DemoQuestion
} from './demoCatalogTypes';
import { UDEMY_COURSES } from './demoCatalogUdemy';
import { buildPeopleDirectory, DEMO_TUTORS, type DemoAccounts } from './demoPeople';

export const DEMO_CATALOG: DemoCourse[] = [...UDEMY_COURSES, ...COURSERA_COURSES, ...SKILLSHARE_COURSES];

const MANUAL_TYPES = new Set(['TEXTAREA', 'SHORT_ANSWER', 'LINK', 'FILE_UPLOAD']);

export function demoOrgId(accounts: DemoAccounts, org: DemoOrgKey) {
  if (org === 'coursera') return accounts.courseraOrgId;
  if (org === 'skillshare') return accounts.skillshareOrgId;

  return accounts.udemyOrgId;
}

export function selectDemoCatalog(accounts: DemoAccounts, selectedOrganizationId?: string) {
  return DEMO_CATALOG.filter(
    (demoCourse) => !selectedOrganizationId || demoOrgId(accounts, demoCourse.org) === selectedOrganizationId
  );
}

export function demoQuestionPoints(demoQuestion: DemoQuestion) {
  if (!('points' in demoQuestion)) return 0;
  if (demoQuestion.points !== undefined) return demoQuestion.points;

  return MANUAL_TYPES.has(demoQuestion.type) ? 20 : 10;
}

function questionSettings(demoQuestion: DemoQuestion) {
  switch (demoQuestion.type) {
    case 'TRUE_FALSE':
      return { correctValue: demoQuestion.correct };
    case 'NUMERIC':
      return { correctValue: demoQuestion.correctValue, tolerance: demoQuestion.tolerance ?? 0 };
    case 'FILL_BLANK':
      return { acceptedAnswers: demoQuestion.answers.join(', ') };
    case 'ORDERING':
      return { items: demoQuestion.items };
    case 'WORD_BANK':
      return {
        template: demoQuestion.template,
        correctAnswers: demoQuestion.correct,
        distractors: demoQuestion.distractors
      };
    case 'SHORT_ANSWER':
      return { acceptedAnswers: demoQuestion.accepted.join(',') };
    case 'FILE_UPLOAD':
      return { acceptedTypes: ['image/png', 'image/jpeg', 'application/pdf'], maxSizeMb: 10 };
    case 'STAR':
      return { maxStars: 5 };
    case 'TEXTAREA':
      return { minCharacters: 80 };
    default:
      return {};
  }
}

function questionOptions(demoQuestion: DemoQuestion): Array<{ label: string; isCorrect: boolean }> {
  switch (demoQuestion.type) {
    case 'RADIO':
    case 'CHECKBOX':
      return demoQuestion.options.map((option) => ({ label: option.label, isCorrect: option.correct ?? false }));
    case 'TRUE_FALSE':
      return [
        { label: 'True', isCorrect: demoQuestion.correct },
        { label: 'False', isCorrect: !demoQuestion.correct }
      ];
    case 'ORDERING':
      return demoQuestion.items.map((label) => ({ label, isCorrect: true }));
    default:
      return [];
  }
}

function lessonVideos(demoLesson: DemoLesson) {
  if (!demoLesson.video) return [];

  const isYoutube = /youtube\.com|youtu\.be/.test(demoLesson.video.link);

  return [
    {
      type: isYoutube ? ('youtube' as const) : ('generic' as const),
      link: demoLesson.video.link,
      fileName: demoLesson.video.title,
      metadata: { title: demoLesson.video.title }
    }
  ];
}

function lessonDocuments(demoLesson: DemoLesson) {
  return (demoLesson.documents ?? []).map((document) => ({ ...document, key: '' }));
}

async function seedExerciseQuestions(exerciseId: string, demoQuestions: DemoQuestion[]) {
  if (demoQuestions.length === 0) return 0;

  const existingQuestions = await db
    .select({ title: question.title, order: question.order })
    .from(question)
    .where(eq(question.exerciseId, exerciseId));
  const existingTitles = new Set(existingQuestions.map((row) => row.title));
  const startOrder = existingQuestions.reduce((max, row) => Math.max(max, row.order ?? 0), 0);
  const missing = demoQuestions.filter((demoQuestion) => !existingTitles.has(demoQuestion.title));
  if (missing.length === 0) return 0;

  const questionRows: TNewQuestion[] = missing.map((demoQuestion, index) => ({
    exerciseId,
    questionTypeId: QUESTION_TYPE[demoQuestion.type],
    title: demoQuestion.title,
    order: startOrder + index + 1,
    points: demoQuestionPoints(demoQuestion),
    settings: questionSettings(demoQuestion)
  }));
  const created = await createQuestions(questionRows);

  const optionRows: TNewOption[] = created.flatMap((createdQuestion, index) =>
    questionOptions(missing[index]).map((option) => ({
      questionId: createdQuestion.id,
      label: option.label,
      isCorrect: option.isCorrect
    }))
  );
  await createOptions(optionRows);

  return created.length;
}

export async function seedDemoCourses({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  const now = new Date();
  const catalog = selectDemoCatalog(accounts, selectedOrganizationId);
  const personId = buildPeopleDirectory(accounts);
  const newCourses = catalog.filter((demoCourse) => !demoCourse.existing);

  const groupIds = newCourses.map(demoGroupId);
  const existingGroups = groupIds.length
    ? await db.select({ id: group.id }).from(group).where(inArray(group.id, groupIds))
    : [];
  const existingGroupIds = new Set(existingGroups.map((row) => row.id));
  const groupsToInsert: TNewGroup[] = newCourses
    .filter((demoCourse) => !existingGroupIds.has(demoGroupId(demoCourse)))
    .map((demoCourse) => ({
      id: demoGroupId(demoCourse),
      name: demoCourse.title,
      description: demoCourse.description,
      organizationId: demoOrgId(accounts, demoCourse.org),
      createdAt: daysFromNow(now, -demoCourse.createdDaysAgo)
    }));

  if (groupsToInsert.length > 0) {
    await db.insert(group).values(groupsToInsert);
  }

  const existingCourses = await db.select({ id: course.id, slug: course.slug }).from(course);
  const existingCourseIds = new Set(existingCourses.map((row) => row.id));
  const takenSlugs = new Set(existingCourses.map((row) => row.slug));
  const coursesToInsert: TNewCourse[] = newCourses
    .filter((demoCourse) => !existingCourseIds.has(demoCourseId(demoCourse)))
    .map((demoCourse) => {
      const baseSlug = slugify(demoCourse.title);
      const slug = takenSlugs.has(baseSlug) ? `${baseSlug}-${demoCourse.index}` : baseSlug;
      const tutor = DEMO_TUTORS.find((demoTutor) => demoTutor.key === demoCourse.instructorKey);
      const createdAt = daysFromNow(now, -demoCourse.createdDaysAgo);

      return {
        id: demoCourseId(demoCourse),
        title: demoCourse.title,
        description: demoCourse.description,
        overview: demoCourse.overview,
        groupId: demoGroupId(demoCourse),
        isTemplate: false,
        bannerImage: demoCourse.bannerImage,
        slug,
        metadata: {
          goals: '',
          description: '',
          requirements: '',
          grading: true,
          lessonDownload: true,
          allowSelfEnrollment: demoCourse.type !== 'COMPLIANCE',
          progressionMode: 'free',
          ...(tutor
            ? {
                instructor: {
                  name: tutor.fullname,
                  role: tutor.headline,
                  description: `${tutor.fullname} teaches ${demoCourse.title}.`,
                  imgUrl: tutor.avatarUrl
                }
              }
            : {})
        },
        cost: 0,
        currency: 'USD',
        isPublished: true,
        certificate: { isDownloadable: true, theme: 'professional' },
        compliance: demoCourse.compliance ?? null,
        status: 'ACTIVE',
        type: demoCourse.type,
        createdAt,
        updatedAt: createdAt
      };
    });

  if (coursesToInsert.length > 0) {
    await db.insert(course).values(coursesToInsert);
  }

  const staff = catalog.flatMap((demoCourse) => {
    const groupId = demoGroupId(demoCourse);
    const instructorId = personId(demoCourse.instructorKey);
    const orgAdminKey =
      demoCourse.org === 'coursera'
        ? 'enterpriseAdmin'
        : demoCourse.org === 'skillshare'
          ? 'earlyAdopterAdmin'
          : 'admin';
    const orgAdminId = personId(orgAdminKey);

    return [...new Set([instructorId, orgAdminId])].map((profileId) => ({ groupId, profileId }));
  });
  const staffGroupIds = [...new Set(staff.map((member) => member.groupId))];
  const existingStaff = staffGroupIds.length
    ? await db
        .select({ groupId: groupmember.groupId, profileId: groupmember.profileId })
        .from(groupmember)
        .where(inArray(groupmember.groupId, staffGroupIds))
    : [];
  const existingStaffKeys = new Set(existingStaff.map((member) => `${member.groupId}-${member.profileId}`));
  const staffToInsert: TNewGroupmember[] = staff
    .filter((member) => !existingStaffKeys.has(`${member.groupId}-${member.profileId}`))
    .map((member) => ({ groupId: member.groupId, profileId: member.profileId, roleId: ROLE.TUTOR }));

  if (staffToInsert.length > 0) {
    await db.insert(groupmember).values(staffToInsert);
  }

  const sections: TNewCourseSection[] = catalog.flatMap((demoCourse) =>
    demoCourse.sections.map((section, sectionIndex) => ({
      id: demoSectionId(demoCourse, sectionIndex),
      courseId: demoCourseId(demoCourse),
      title: section.title,
      order: sectionIndex + 1 + (demoCourse.existing?.lessonIds.length ? 1 : 0)
    }))
  );
  const existingSections = await db
    .select({ id: courseSection.id })
    .from(courseSection)
    .where(
      inArray(
        courseSection.id,
        sections.map((section) => section.id!)
      )
    );
  const existingSectionIds = new Set(existingSections.map((row) => row.id));
  const sectionsToInsert = sections.filter((section) => !existingSectionIds.has(section.id!));

  if (sectionsToInsert.length > 0) {
    await db.insert(courseSection).values(sectionsToInsert);
  }

  const lessons: Array<TNewLesson & { content: string }> = catalog.flatMap((demoCourse) =>
    demoCourse.sections.flatMap((section, sectionIndex) =>
      section.lessons.map((demoLesson, lessonIndex) => {
        const live = demoLesson.live;
        const sessionEnded = live ? live.startsInMinutes + live.durationMinutes < 0 : false;
        const createdAt = daysFromNow(now, -demoCourse.createdDaysAgo + sectionIndex * 3 + lessonIndex);
        const lessonSlug = slugify(demoLesson.title);

        return {
          id: demoLessonId(demoCourse, sectionIndex, lessonIndex),
          courseId: demoCourseId(demoCourse),
          sectionId: demoSectionId(demoCourse, sectionIndex),
          title: demoLesson.title,
          slug: lessonSlug,
          teacherId: personId(demoCourse.instructorKey),
          videos: lessonVideos(demoLesson),
          documents: lessonDocuments(demoLesson),
          isUnlocked: !demoLesson.locked,
          order: lessonIndex + 1,
          lessonAt: live ? minutesFromNow(now, live.startsInMinutes) : createdAt,
          callUrl: live ? `https://meet.jit.si/classroomio-demo-${lessonSlug}` : null,
          sessionDurationMinutes: live?.durationMinutes ?? null,
          recordingUrl: sessionEnded && live?.recording ? live.recording.link : null,
          createdAt,
          updatedAt: createdAt,
          content: renderLessonHtml(demoLesson)
        };
      })
    )
  );
  const lessonIds = lessons.map((row) => row.id!);
  const existingLessons = await db.select({ id: lesson.id }).from(lesson).where(inArray(lesson.id, lessonIds));
  const existingLessonIds = new Set(existingLessons.map((row) => row.id));
  const lessonsToInsert = lessons
    .filter((row) => !existingLessonIds.has(row.id!))
    .map(({ content: _content, ...row }) => row);

  if (lessonsToInsert.length > 0) {
    await db.insert(lesson).values(lessonsToInsert);
  }

  const existingLanguages = await db
    .select({ lessonId: lessonLanguage.lessonId })
    .from(lessonLanguage)
    .where(inArray(lessonLanguage.lessonId, lessonIds));
  const lessonsWithContent = new Set(existingLanguages.map((row) => row.lessonId));
  const languagesToInsert = lessons
    .filter((row) => !lessonsWithContent.has(row.id!))
    .map((row) => ({ lessonId: row.id!, locale: 'en' as const, content: row.content }));

  if (languagesToInsert.length > 0) {
    await db.insert(lessonLanguage).values(languagesToInsert);
  }

  const exercises: TNewExercise[] = catalog.flatMap((demoCourse) =>
    demoCourse.sections.flatMap((section, sectionIndex) =>
      (section.exercises ?? []).map((demoExercise, exerciseIndex) => ({
        id: demoExerciseId(demoCourse, sectionIndex, exerciseIndex),
        title: demoExercise.title,
        slug: slugify(demoExercise.title),
        description: demoExercise.description,
        courseId: demoCourseId(demoCourse),
        sectionId: demoSectionId(demoCourse, sectionIndex),
        order: section.lessons.length + exerciseIndex + 1,
        isUnlocked: true,
        dueBy: demoExercise.dueInDays === undefined ? null : daysFromNow(now, demoExercise.dueInDays),
        createdAt: daysFromNow(now, -demoCourse.createdDaysAgo + sectionIndex * 3 + 2)
      }))
    )
  );
  const existingExercises = exercises.length
    ? await db
        .select({ id: exercise.id })
        .from(exercise)
        .where(
          inArray(
            exercise.id,
            exercises.map((row) => row.id!)
          )
        )
    : [];
  const existingExerciseIds = new Set(existingExercises.map((row) => row.id));
  const exercisesToInsert = exercises.filter((row) => !existingExerciseIds.has(row.id!));

  if (exercisesToInsert.length > 0) {
    await db.insert(exercise).values(exercisesToInsert);
  }

  let insertedQuestions = 0;
  for (const demoCourse of catalog) {
    for (const existingExercise of demoCourse.existing?.exercises ?? []) {
      insertedQuestions += await seedExerciseQuestions(existingExercise.id, existingExercise.extraQuestions ?? []);
    }

    for (const [sectionIndex, section] of demoCourse.sections.entries()) {
      for (const [exerciseIndex, demoExercise] of (section.exercises ?? []).entries()) {
        insertedQuestions += await seedExerciseQuestions(
          demoExerciseId(demoCourse, sectionIndex, exerciseIndex),
          demoExercise.questions
        );
      }
    }
  }

  console.log(
    `   ✓ Demo courses: ${coursesToInsert.length} course(s), ${sectionsToInsert.length} section(s), ${lessonsToInsert.length} lesson(s), ${exercisesToInsert.length} exercise(s), ${insertedQuestions} question(s) added`
  );
}
