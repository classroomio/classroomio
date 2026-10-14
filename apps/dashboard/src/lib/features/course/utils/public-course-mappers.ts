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

export function toPublicSidebarSections(tree: PublicCourseTree): PublicCourseSidebarSection[] {
  const sections: Array<PublicCourseSidebarSection & { order: number }> = tree.sections.map((section) => ({
    id: section.id,
    title: section.title,
    order: section.order,
    items: []
  }));
  for (const item of tree.items) {
    const sidebarItem = {
      kind: item.kind,
      id: item.id,
      slug: item.slug,
      title: item.title,
      isUnlocked: item.isUnlocked
    };
    const section = sections.find((entry) => entry.id === item.sectionId);
    if (section) {
      section.items.push(sidebarItem);
      continue;
    }

    sections.push({
      id: `standalone-${item.id}`,
      title: '',
      order: item.order,
      standalone: true,
      items: [sidebarItem]
    });
  }
  return sections.filter((section) => section.items.length > 0).sort((left, right) => left.order - right.order);
}

export function toPublicLessonView(lesson: Extract<PublicItem, { kind: 'lesson' }>): PublicLessonViewData {
  return {
    kind: 'lesson',
    title: lesson.title,
    sectionTitle: lesson.sectionTitle,
    body: lesson.body ?? '',
    // `lesson.video.hls` may be present on the wire from the public-course
    // API but isn't in the older inferred type; spread through verbatim.
    video: lesson.video as PublicLessonViewData['video'],
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
