import type { TCourseType } from '@cio/utils/constants/course-type';
import type { TNewCourse } from '@db/types';

import type { DemoDocument, DemoVideo } from './demoMedia';

export type DemoOrgKey = 'udemy' | 'coursera' | 'skillshare';

export type DemoQuestion =
  | { type: 'RADIO' | 'CHECKBOX'; title: string; options: { label: string; correct?: boolean }[]; points?: number }
  | { type: 'TRUE_FALSE'; title: string; correct: boolean; points?: number }
  | { type: 'NUMERIC'; title: string; correctValue: number; tolerance?: number; points?: number }
  | { type: 'FILL_BLANK'; title: string; answers: string[]; points?: number }
  | { type: 'ORDERING'; title: string; items: string[]; points?: number }
  | {
      type: 'WORD_BANK';
      title: string;
      template: string;
      correct: string[];
      distractors: string[];
      points?: number;
    }
  | { type: 'SHORT_ANSWER'; title: string; accepted: string[]; sampleAnswers: string[]; points?: number }
  | { type: 'TEXTAREA'; title: string; sampleAnswers: string[]; points?: number }
  | { type: 'LINK'; title: string; sampleLinks: string[]; points?: number }
  | { type: 'FILE_UPLOAD'; title: string; points?: number }
  | { type: 'STAR' | 'THUMBS'; title: string };

export type DemoExercise = {
  key: string;
  title: string;
  description: string;
  dueInDays?: number;
  questions: DemoQuestion[];
};

export type DemoLessonBlock = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
};

export type DemoLesson = {
  title: string;
  video?: DemoVideo;
  intro: string;
  blocks: DemoLessonBlock[];
  documents?: DemoDocument[];
  /** Minutes from seed time; negative means the session already started. */
  live?: { startsInMinutes: number; durationMinutes: number; recording?: DemoVideo };
  locked?: boolean;
};

export type DemoSection = {
  title: string;
  lessons: DemoLesson[];
  exercises?: DemoExercise[];
};

export type DemoCourse = {
  key: string;
  /** Stable index used to derive every id in the course. */
  index: number;
  org: DemoOrgKey;
  title: string;
  description: string;
  overview: string;
  bannerImage: string;
  type: TCourseType;
  instructorKey: string;
  createdDaysAgo: number;
  compliance?: TNewCourse['compliance'];
  /** Adds sections to a course another seed already created. */
  existing?: {
    courseId: string;
    groupId: string;
    lessonIds: string[];
    exercises: Array<{ key: string; id: string; extraQuestions?: DemoQuestion[] }>;
  };
  sections: DemoSection[];
};

const DEMO_ID_PREFIX = '5d000000';

export function demoId(kind: string, ...parts: number[]): string {
  const suffix = parts.map((part) => String(part).padStart(4, '0')).join('');

  return `${DEMO_ID_PREFIX}-${kind}-4000-8000-${suffix.padEnd(12, '0')}`;
}

export function demoGroupId(demoCourse: DemoCourse) {
  return demoCourse.existing?.groupId ?? demoId('1000', demoCourse.index);
}

export function demoCourseId(demoCourse: DemoCourse) {
  return demoCourse.existing?.courseId ?? demoId('2000', demoCourse.index);
}

export function demoSectionId(demoCourse: DemoCourse, sectionIndex: number) {
  return demoId('3000', demoCourse.index, sectionIndex + 1);
}

export function demoLessonId(demoCourse: DemoCourse, sectionIndex: number, lessonIndex: number) {
  return demoId('4000', demoCourse.index, sectionIndex + 1, lessonIndex + 1);
}

export function demoExerciseId(demoCourse: DemoCourse, sectionIndex: number, exerciseIndex: number) {
  return demoId('5000', demoCourse.index, sectionIndex + 1, exerciseIndex + 1);
}

/** Lesson ids in reading order, including lessons from an existing course. */
export function demoCourseLessonIds(demoCourse: DemoCourse): string[] {
  const added = demoCourse.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((_, lessonIndex) => demoLessonId(demoCourse, sectionIndex, lessonIndex))
  );

  return [...(demoCourse.existing?.lessonIds ?? []), ...added];
}

export function findDemoExerciseId(demoCourse: DemoCourse, exerciseKey: string) {
  const existingExercise = demoCourse.existing?.exercises.find((exercise) => exercise.key === exerciseKey);
  if (existingExercise) return existingExercise.id;

  for (const [sectionIndex, section] of demoCourse.sections.entries()) {
    const exerciseIndex = (section.exercises ?? []).findIndex((exercise) => exercise.key === exerciseKey);
    if (exerciseIndex === -1) continue;

    return demoExerciseId(demoCourse, sectionIndex, exerciseIndex);
  }

  throw new Error(`Unknown demo exercise ${demoCourse.key}/${exerciseKey}`);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderLessonHtml(lesson: Pick<DemoLesson, 'intro' | 'blocks'>) {
  const blocks = lesson.blocks.map((block) => {
    const paragraphs = (block.paragraphs ?? []).map((paragraph) => `<p>${paragraph}</p>`).join('');
    const bullets = block.bullets?.length
      ? `<ul>${block.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`
      : '';
    const code = block.code ? `<pre><code>${escapeHtml(block.code)}</code></pre>` : '';

    return `<h2>${block.heading}</h2>${paragraphs}${bullets}${code}`;
  });

  return `<p>${lesson.intro}</p>${blocks.join('')}`;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function daysFromNow(now: Date, days: number) {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

export function minutesFromNow(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60 * 1000).toISOString();
}
