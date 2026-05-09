import type {
  PublicCourseSidebarSection,
  PublicExerciseViewData,
  PublicLessonViewData
} from '@cio/ui/custom/public-course';
import type { ExerciseQuestionModel, ExerciseQuestionTypeKey } from '@cio/question-types';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

type GetPublicCourseSuccess = Extract<
  InferResponseType<(typeof classroomio)['org-site']['course'][':courseSlug']['$get']>,
  { success: true }
>;

type PublicCourseTree = GetPublicCourseSuccess['data'];

type GetPublicCourseItemSuccess = Extract<
  InferResponseType<(typeof classroomio)['org-site']['course'][':courseSlug']['item'][':itemSlug']['$get']>,
  { success: true }
>;

type PublicItem = GetPublicCourseItemSuccess['data'];

/**
 * Group the flat tree into sidebar sections. Items that aren't assigned to any
 * section are grouped under a synthetic "Lessons" section so the UI never has
 * orphaned rows.
 */
export function toPublicSidebarSections(tree: PublicCourseTree): PublicCourseSidebarSection[] {
  const sectionLookup = new Map<string, PublicCourseSidebarSection>();
  for (const section of tree.sections) {
    sectionLookup.set(section.id, {
      id: section.id,
      title: section.title,
      items: []
    });
  }

  const orphanSection: PublicCourseSidebarSection = {
    id: '__unsectioned',
    title: 'Lessons',
    items: []
  };

  for (const item of tree.items) {
    const targetSection =
      item.sectionId && sectionLookup.has(item.sectionId) ? sectionLookup.get(item.sectionId)! : orphanSection;

    targetSection.items.push({
      kind: item.kind,
      id: item.id,
      slug: item.slug,
      title: item.title,
      isUnlocked: item.isUnlocked
    });
  }

  const ordered = Array.from(sectionLookup.values()).filter((section) => section.items.length > 0);

  if (orphanSection.items.length > 0) {
    ordered.push(orphanSection);
  }

  return ordered;
}

export function toPublicLessonView(lesson: Extract<PublicItem, { kind: 'lesson' }>): PublicLessonViewData {
  return {
    kind: 'lesson',
    title: lesson.title,
    sectionTitle: lesson.sectionTitle,
    body: lesson.body ?? '',
    video: lesson.video,
    isUnlocked: lesson.isUnlocked
  };
}

type ApiQuestion = Extract<PublicItem, { kind: 'exercise' }>['questions']['unsectioned'][number];

/**
 * Convert API question shapes into `ExerciseQuestionModel`s so the public
 * exercise view can drive the same renderer pipeline as the authenticated
 * student view (`ExerciseQuestion.QuestionList`). Question types that aren't
 * auto-gradable are filtered out — the creator UI already blocks them on
 * PUBLIC courses, but we double-check here so the page never ships answers
 * for a question we can't grade in the browser.
 */
export function toPublicExerciseQuestions(questions: {
  unsectioned: ApiQuestion[];
  sections: Array<{ questions: ApiQuestion[] }>;
}): ExerciseQuestionModel[] {
  const all = [...questions.unsectioned, ...questions.sections.flatMap((section) => section.questions)];

  return all.map((question) => mapQuestion(question));
}

function mapQuestion(question: ApiQuestion): ExerciseQuestionModel {
  return {
    id: question.id,
    title: question.title,
    questionType: question.questionTypeKey as ExerciseQuestionTypeKey,
    points: question.points,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      isCorrect: option.isCorrect,
      settings: (option.settings ?? {}) as Record<string, unknown>
    })),
    settings: (question.settings ?? {}) as Record<string, unknown>
  };
}

export function toPublicExerciseView(exercise: Extract<PublicItem, { kind: 'exercise' }>): PublicExerciseViewData {
  return {
    kind: 'exercise',
    title: exercise.title,
    description: exercise.description,
    sectionTitle: exercise.sectionTitle,
    isUnlocked: exercise.isUnlocked,
    questions: toPublicExerciseQuestions(exercise.questions)
  };
}
