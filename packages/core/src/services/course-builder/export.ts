import type {
  LearningPackage,
  LessonBlock,
  PackageCourse,
  PackageLabels,
  PackageLesson,
  QuizQuestion
} from '@cio/course-builder';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';
import {
  ZCourseImportDraftPayload,
  type TCourseImportDraftExercise,
  type TCourseImportDraftExerciseQuestion,
  type TCourseImportDraftPayload,
  type TCourseImportDraftSection,
  type TCourseImportDraftLesson
} from '@cio/utils/validation';

export { ENGLISH_PACKAGE_LABELS } from '@cio/course-builder';
export type { LearningPackage, PackageCourse, QuizQuestion } from '@cio/course-builder';

const SUPPORTED_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'];

const VIDEO_TYPES: Record<string, 'youtube' | 'vimeo' | 'generic'> = {
  youtube: 'youtube',
  vimeo: 'vimeo'
};

interface DraftWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Lesson bodies start at h3 in a ClassroomIO lesson; a generated h1 or h2 would break the reader's outline. */
function demoteHeadings(html: string): string {
  return html.replace(/<(\/?)h([12])\b/g, '<$1h3');
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function blockHtml(block: LessonBlock, labels: PackageLabels): string {
  switch (block.type) {
    case 'text':
      return demoteHeadings(block.html);
    case 'callout': {
      const label = escapeHtml(labels[block.tone]);

      return `<blockquote><p><strong>${label}</strong></p>${demoteHeadings(block.html)}</blockquote>`;
    }
    case 'image': {
      const alt = escapeHtml(block.alt);
      const caption = block.alt ? `<figcaption>${alt}</figcaption>` : '';

      return `<figure><img src="${escapeHtml(block.url)}" alt="${alt}">${caption}</figure>`;
    }
    case 'video':
      return '';
  }
}

function sourceParagraph(sourceUrls: string[], labels: PackageLabels): string {
  const links = sourceUrls.map((url) => `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`).join(', ');

  return `<p><strong>${escapeHtml(labels.source)}:</strong> ${links}</p>`;
}

function lessonHtml(lesson: PackageLesson, labels: PackageLabels): string {
  const body = lesson.blocks
    .map((block) => blockHtml(block, labels))
    .filter(Boolean)
    .join('\n');

  return `${body}\n${sourceParagraph(lesson.sourceUrls, labels)}`;
}

function lessonVideos(lesson: PackageLesson): Array<{ type: 'youtube' | 'vimeo' | 'generic'; link: string }> {
  const seen = new Set<string>();
  const videos: Array<{ type: 'youtube' | 'vimeo' | 'generic'; link: string }> = [];

  for (const block of lesson.blocks) {
    if (block.type !== 'video' || seen.has(block.url)) continue;

    seen.add(block.url);
    videos.push({ type: VIDEO_TYPES[block.provider] ?? 'generic', link: block.url });
  }

  return videos;
}

function questionDraft(question: QuizQuestion, order: number, warnings: DraftWarning[]) {
  const base = {
    question: question.prompt,
    points: question.points,
    order
  };

  switch (question.type) {
    case 'single':
      return {
        ...base,
        questionTypeId: QUESTION_TYPE.RADIO,
        options: question.options.map((option) => ({ label: option.label, isCorrect: option.correct }))
      };
    case 'multiple':
      return {
        ...base,
        questionTypeId: QUESTION_TYPE.CHECKBOX,
        options: question.options.map((option) => ({ label: option.label, isCorrect: option.correct }))
      };
    case 'true-false': {
      const correct = question.options.find((option) => option.correct)?.label ?? '';

      return {
        ...base,
        questionTypeId: QUESTION_TYPE.TRUE_FALSE,
        settings: { correctValue: /^true$/i.test(correct) },
        options: [
          { label: 'True', isCorrect: /^true$/i.test(correct) },
          { label: 'False', isCorrect: !/^true$/i.test(correct) }
        ]
      };
    }
    case 'ordering':
      return {
        ...base,
        questionTypeId: QUESTION_TYPE.ORDERING,
        settings: { items: question.orderedSteps ?? [] },
        options: (question.orderedSteps ?? []).map((step) => ({ label: step, isCorrect: false }))
      };
    case 'link':
      return { ...base, questionTypeId: QUESTION_TYPE.LINK };
    case 'text':
      return { ...base, questionTypeId: QUESTION_TYPE.TEXTAREA };
    case 'matching':
      warnings.push({
        code: 'matching-question-dropped',
        message: `Dropped a matching question, because ClassroomIO has no matching question type: "${question.prompt}"`,
        severity: 'warning'
      });
      return null;
  }
}

function draftQuestions(questions: QuizQuestion[], warnings: DraftWarning[]): TCourseImportDraftExerciseQuestion[] {
  const drafts: TCourseImportDraftExerciseQuestion[] = [];

  for (const question of questions) {
    const draft = questionDraft(question, drafts.length + 1, warnings);
    if (draft) drafts.push(draft as TCourseImportDraftExerciseQuestion);
  }

  return drafts;
}

function courseExercises(
  course: PackageCourse,
  labels: PackageLabels,
  topLevelStart: number,
  warnings: DraftWarning[]
): TCourseImportDraftExercise[] {
  const exercises: TCourseImportDraftExercise[] = [];

  for (const [index, section] of course.sections.entries()) {
    const questions = draftQuestions(section.check, warnings);
    if (!questions.length) continue;

    exercises.push({
      externalId: `s${index + 1}-check`,
      sectionExternalId: `s${index + 1}`,
      title: fill(labels.sectionCheck, { section: section.title }),
      order: 1,
      questions
    });
  }

  const finalQuiz = draftQuestions(course.finalQuiz, warnings);
  if (finalQuiz.length) {
    exercises.push({
      externalId: 'final-quiz',
      title: fill(labels.finalQuiz, { course: course.title }),
      order: topLevelStart,
      questions: finalQuiz
    });
  }

  const practice = draftQuestions(course.practiceTasks, warnings);
  if (practice.length) {
    exercises.push({
      externalId: 'practice',
      title: fill(labels.practice, { course: course.title }),
      order: topLevelStart + (finalQuiz.length ? 1 : 0),
      questions: practice
    });
  }

  return exercises;
}

/**
 * Converts one course of a learning package into the payload the ClassroomIO course importer accepts. The result is
 * validated by the importer's own schema, so a mapping mistake throws here rather than halfway through a publish.
 */
export function toCourseImportDraft(pkg: LearningPackage, courseKey: string): TCourseImportDraftPayload {
  const course = pkg.courses.find((entry) => entry.key === courseKey);
  if (!course) throw new Error(`The learning package has no course "${courseKey}"`);

  const warnings: DraftWarning[] = [];
  const locale = SUPPORTED_LOCALES.includes(pkg.locale) ? pkg.locale : 'en';
  if (locale !== pkg.locale) {
    warnings.push({
      code: 'locale-not-supported',
      message: `ClassroomIO has no "${pkg.locale}" course locale; the course is imported as English`,
      severity: 'warning'
    });
  }

  const sections: TCourseImportDraftSection[] = course.sections.map((section, index) => ({
    externalId: `s${index + 1}`,
    title: section.title,
    order: index + 1
  }));

  const lessons: TCourseImportDraftLesson[] = course.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((lesson, lessonIndex) => {
      const videos = lessonVideos(lesson);

      return {
        externalId: `s${sectionIndex + 1}l${lessonIndex + 1}`,
        sectionExternalId: `s${sectionIndex + 1}`,
        title: lesson.title,
        order: lessonIndex + 1,
        ...(videos.length ? { videos } : {})
      };
    })
  );

  const lessonLanguages = course.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((lesson, lessonIndex) => ({
      lessonExternalId: `s${sectionIndex + 1}l${lessonIndex + 1}`,
      locale: locale as TCourseImportDraftPayload['lessonLanguages'][number]['locale'],
      content: lessonHtml(lesson, pkg.labels)
    }))
  );

  const sourceUrls = [
    ...new Set(course.sections.flatMap((section) => section.lessons.flatMap((lesson) => lesson.sourceUrls)))
  ];
  const outcomes = course.outcomes.length
    ? `\n\n${pkg.labels.outcomes}\n${course.outcomes.map((outcome) => `- ${outcome}`).join('\n')}`
    : '';

  return ZCourseImportDraftPayload.parse({
    course: {
      title: course.title,
      description: `${course.description}${outcomes}`,
      type: 'SELF_PACED',
      locale
    },
    tags: [],
    sections,
    lessons,
    lessonLanguages,
    exercises: courseExercises(course, pkg.labels, sections.length + 1, warnings),
    sourceReferences: sourceUrls.map((url) => ({ type: 'website' as const, label: url })),
    warnings
  });
}

/** Converts every course in a package, one import draft each. */
export function toCourseImportDrafts(pkg: LearningPackage): TCourseImportDraftPayload[] {
  return pkg.courses.map((course) => toCourseImportDraft(pkg, course.key));
}
