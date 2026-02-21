import { TCourse, TCourseSection, TLesson } from '@db/types';
import {
  addGroupMember,
  createCourse,
  createExercises,
  createGroup,
  createLessonLanguages,
  createCourseSections,
  createLessons,
  createOptions,
  createQuestions,
  getCourseById,
  getExercisesByLessonIds,
  getLessonLanguagesByLessonIds,
  getLessonsByCourseId,
  getOptionsByQuestionIds,
  getQuestionsByExerciseIds,
  getCourseSectionsByCourseId
} from '@db/queries';

import { ROLE } from '@cio/utils/constants';

// Constants
const QUESTION_TYPE_TEXTAREA = 2; // Paragraph question type

async function cloneLessonLanguages(newLessons: TLesson[], oldLessons: TLesson[]): Promise<void> {
  // Extract old lesson IDs
  const oldLessonIds = oldLessons.map((lesson) => lesson.id);

  // Fetch all lesson languages for the old lessons
  const oldLessonLanguages = await getLessonLanguagesByLessonIds(oldLessonIds);

  if (!oldLessonLanguages || oldLessonLanguages.length === 0) {
    return;
  }

  // Create a map of old lesson ID to new lesson ID
  const lessonIdMap = new Map<string, string>();
  oldLessons.forEach((oldLesson, index) => {
    lessonIdMap.set(oldLesson.id, newLessons[index].id);
  });

  // Map lesson languages to new lesson IDs
  const newLessonLanguages = oldLessonLanguages.map((lang) => ({
    content: lang.content,
    locale: lang.locale,
    lessonId: lessonIdMap.get(lang.lessonId!)!
  }));

  // Bulk insert lesson languages
  await createLessonLanguages(newLessonLanguages);
}

async function cloneExercises(newLessons: TLesson[], oldLessons: TLesson[]): Promise<void> {
  // 1. Extract old lesson IDs
  const oldLessonIds = oldLessons.map((lesson) => lesson.id);

  // 2. Fetch all exercises for old lessons
  const oldExercises = await getExercisesByLessonIds(oldLessonIds);

  if (!oldExercises || oldExercises.length === 0) {
    return;
  }

  // 3. Create lesson ID map
  const lessonIdMap = new Map<string, string>();
  oldLessons.forEach((oldLesson, index) => {
    lessonIdMap.set(oldLesson.id, newLessons[index].id);
  });

  // 4. Insert exercises with new lesson IDs
  const newExercises = await createExercises(
    oldExercises.map((exercise) => ({
      title: exercise.title,
      description: exercise.description,
      dueBy: new Date().toISOString(),
      lessonId: lessonIdMap.get(exercise.lessonId!)!
    }))
  );

  // 5. Create exercise ID map
  const exerciseIdMap = new Map<string, string>();
  oldExercises.forEach((oldExercise, index) => {
    exerciseIdMap.set(oldExercise.id, newExercises[index].id);
  });

  // 6. Fetch all questions for old exercises
  const oldExerciseIds = oldExercises.map((ex) => ex.id);
  const oldQuestions = await getQuestionsByExerciseIds(oldExerciseIds);

  if (!oldQuestions || oldQuestions.length === 0) {
    return;
  }

  // 7. Insert questions with new exercise IDs
  const newQuestions = await createQuestions(
    oldQuestions.map((question) => ({
      name: question.name,
      title: question.title,
      points: question.points,
      order: question.order,
      questionTypeId: question.questionTypeId,
      exerciseId: exerciseIdMap.get(question.exerciseId)!
    }))
  );

  // 8. Create question ID map
  const questionIdMap = new Map<number, number>();
  oldQuestions.forEach((oldQuestion, index) => {
    const newQuestionId = newQuestions[index]?.id;
    const oldQuestionId = oldQuestion.id;
    if (newQuestionId !== undefined && oldQuestionId !== undefined) {
      questionIdMap.set(oldQuestionId, newQuestionId);
    }
  });

  // 9. Fetch all options for old questions (except for paragraph type questions)
  const oldQuestionIds = oldQuestions
    .filter((q) => q.questionTypeId !== QUESTION_TYPE_TEXTAREA)
    .map((q) => q.id)
    .filter((id) => id !== undefined);

  if (oldQuestionIds.length === 0) {
    return;
  }

  const oldOptions = await getOptionsByQuestionIds(oldQuestionIds);

  if (!oldOptions || oldOptions.length === 0) {
    return;
  }

  // 10. Insert options with new question IDs
  await createOptions(
    oldOptions
      .map((option) => {
        const newQuestionId = questionIdMap.get(option.questionId);
        if (newQuestionId === undefined) {
          return null;
        }
        return {
          value: option.value,
          label: option.label,
          isCorrect: option.isCorrect,
          questionId: newQuestionId
        };
      })
      .filter((opt) => opt !== null)
  );
}

export async function cloneCourse(
  courseId: string,
  newTitle: string,
  userId: string,
  newDescription?: string,
  newSlug?: string,
  organizationId?: string
): Promise<TCourse> {
  // 1. fetch old course
  const [course] = await getCourseById(courseId);

  // 2. create group
  const [newGroup] = await createGroup({
    name: newTitle,
    description: newDescription ?? course.description,
    organizationId: organizationId
  });

  // 3. create course for that group
  // Explicitly select only the fields we want to copy (exclude id, createdAt, updatedAt)
  const [newCourse] = await createCourse({
    title: newTitle,
    description: course.description,
    overview: course.overview,
    groupId: newGroup.id,
    isTemplate: course.isTemplate,
    logo: course.logo,
    slug: newSlug ?? null,
    metadata: course.metadata,
    cost: course.cost,
    currency: course.currency,
    bannerImage: course.bannerImage,
    isPublished: course.isPublished,
    isCertificateDownloadable: course.isCertificateDownloadable,
    certificateTheme: course.certificateTheme,
    status: course.status,
    type: course.type
  });

  // 4. add group member
  await addGroupMember({
    profileId: userId,
    email: '',
    groupId: newGroup.id,
    roleId: ROLE.TUTOR
  });

  // 5. clone sections
  const oldSections = await getCourseSectionsByCourseId(courseId);

  // Only create sections if there are any
  let newSections: TCourseSection[] = [];
  let sectionMap = new Map<string, string>();

  if (oldSections.length > 0) {
    newSections = await createCourseSections(
      oldSections.map((section) => ({
        title: section.title,
        order: section.order,
        courseId: newCourse.id
      }))
    );

    // create map
    sectionMap = new Map(oldSections.map((section, index) => [section.id, newSections[index].id]));
  }

  // 6. clone lessons
  const oldLessons = await getLessonsByCourseId(courseId);

  const newLessons = await createLessons(
    oldLessons.map((lesson) => ({
      note: lesson.note,
      videoUrl: lesson.videoUrl,
      slideUrl: lesson.slideUrl,
      courseId: newCourse.id,
      title: lesson.title,
      public: lesson.public,
      lessonAt: lesson.lessonAt,
      teacherId: lesson.teacherId,
      isComplete: lesson.isComplete,
      callUrl: lesson.callUrl,
      order: lesson.order,
      isUnlocked: lesson.isUnlocked,
      videos: lesson.videos,
      sectionId: lesson.sectionId ? sectionMap.get(lesson.sectionId) : null,
      documents: lesson.documents
    }))
  );

  // 7. clone languages, exercises, questions, options using bulk queries
  await cloneLessonLanguages(newLessons, oldLessons);
  await cloneExercises(newLessons, oldLessons);

  return newCourse;
}
