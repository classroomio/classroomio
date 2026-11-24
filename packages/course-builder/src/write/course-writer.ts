import * as z from 'zod/v4';

import { withLessonMedia, type MediaOptions } from '../media/lesson-media';
import { matchVideo, type ChannelVideo } from '../media/youtube';
import {
  ENGLISH_PACKAGE_LABELS,
  ZPackageCourse,
  ZPackageLabels,
  type PackageCourse,
  type PackageLabels,
  type PackageSection
} from '../package/schema';
import type { SectionBrief } from '../plan/briefs';
import type { CoursePlan } from '../plan/sections';
import type { GlossaryEntry } from '../understand/glossary';
import type { StructuredCaller } from '../verify/types';
import { courseQuiz, sectionCheck } from './quizzes';
import { writeSection, type CitedCaller, type CourseContext, type WrittenSection } from './section-writer';

export interface WriteCourseInput extends Omit<MediaOptions, 'fetchedAt'> {
  plan: CoursePlan;
  briefs: SectionBrief[];
  glossary: GlossaryEntry[];
  fetchedAt: string;
  /** The organisation's own channel videos (`channelVideos`); a lesson without an embedded video gets its best match. */
  channelVideos?: ChannelVideo[];
  /** Section requests in flight at once after the first. */
  concurrency?: number;
  /** Pause between starting section requests, so a burst does not hit rate limits. */
  staggerMs?: number;
  /** Called as each section's writing ends, written or not, for progress. */
  onSectionDone?: () => void;
  signal?: AbortSignal;
}

export interface WrittenCourse {
  course: PackageCourse;
  gaps: Array<{ topic: string; detail: string }>;
  /** What could not be written or kept, for the build report. */
  issues: string[];
  stats: { uncitedParagraphs: number; skippedMedia: number; images: number; videos: number; droppedQuestions: number };
}

const DEFAULT_CONCURRENCY = 12;
const DEFAULT_STAGGER_MS = 200;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SectionAttempt = { section: WrittenSection; failure: null } | { section: null; failure: string };

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function writeWithRetry(
  caller: CitedCaller,
  context: CourseContext,
  brief: SectionBrief,
  input: WriteCourseInput,
  onFirstToken?: () => void
): Promise<SectionAttempt> {
  try {
    const written = await writeSection(caller, context, brief, { signal: input.signal, onFirstToken });
    if (!written.issues.length) return { section: written, failure: null };

    const again = await writeSection(caller, context, brief, { signal: input.signal, problems: written.issues });

    return { section: again.lessons.length >= written.lessons.length ? again : written, failure: null };
  } catch (error) {
    onFirstToken?.();
    if (input.signal?.aborted) return { section: null, failure: reasonOf(error) };

    return writeSection(caller, context, brief, { signal: input.signal }).then(
      (section): SectionAttempt => ({ section, failure: null }),
      (retryError): SectionAttempt => ({ section: null, failure: reasonOf(retryError) })
    );
  }
}

/**
 * Writes every section of one planned course from its briefs, with its checks, final quiz, practice tasks and media.
 * The first section's request goes alone; once it starts answering, the course-wide prefix is cached and the others
 * follow, `concurrency` at a time, `staggerMs` apart. A section that fails is written once more, then left out and
 * reported.
 */
export async function writeCourse(
  caller: CitedCaller & StructuredCaller,
  input: WriteCourseInput
): Promise<WrittenCourse> {
  const context: CourseContext = {
    courseTitle: input.plan.title,
    audience: input.plan.course.audience,
    outcomes: input.plan.outcomes,
    glossary: input.glossary,
    fetchedAt: input.fetchedAt
  };
  const concurrency = input.concurrency ?? DEFAULT_CONCURRENCY;
  const staggerMs = input.staggerMs ?? DEFAULT_STAGGER_MS;

  const quiz = courseQuiz(caller, input.plan.title, input.briefs, input.signal);
  const checks = input.briefs.map((brief) => sectionCheck(caller, brief, input.signal));

  const written: Array<SectionAttempt | null> = new Array(input.briefs.length).fill(null);
  if (input.briefs.length) {
    let cacheReady!: () => void;
    const cached = new Promise<void>((resolve) => (cacheReady = resolve));
    const first = writeWithRetry(caller, context, input.briefs[0], input, cacheReady).then((attempt) => {
      written[0] = attempt;
      input.onSectionDone?.();
    });
    await Promise.race([cached, first]);

    const queue = input.briefs.map((_, index) => index).slice(1);
    const work = async () => {
      for (let index = queue.shift(); index !== undefined; index = queue.shift()) {
        written[index] = await writeWithRetry(caller, context, input.briefs[index], input);
        input.onSectionDone?.();
      }
    };
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async (_, slot) => {
      await pause(slot * staggerMs);
      await work();
    });
    await Promise.all([first, ...workers]);
  }

  const issues: string[] = [];
  const gaps: WrittenCourse['gaps'] = [];
  const stats = { uncitedParagraphs: 0, skippedMedia: 0, images: 0, videos: 0, droppedQuestions: 0 };
  const sections: PackageSection[] = [];
  const usedVideos = new Set<string>();
  const checkResults = await Promise.all(checks.map((check) => check.catch(() => null)));

  for (const [index, brief] of input.briefs.entries()) {
    const section = written[index]?.section;
    if (!section || !section.lessons.length) {
      const reason = written[index]?.failure ?? section?.issues.join(' ') ?? 'not started';
      issues.push(`Section "${brief.section.title}" could not be written: ${reason}`);
      continue;
    }

    issues.push(...section.issues.map((issue) => `${brief.section.title}: ${issue}`));
    gaps.push(...section.gaps);

    const lessons = [];
    for (const lesson of section.lessons) {
      const briefLesson = brief.lessons.find((candidate) => candidate.key === lesson.key)!;
      const media = await withLessonMedia(lesson.blocks, briefLesson, { ...input, fetchedAt: input.fetchedAt });
      stats.uncitedParagraphs += lesson.uncitedParagraphs;
      stats.skippedMedia += media.skipped;
      stats.images += media.blocks.filter((block) => block.type === 'image').length;
      stats.videos += media.blocks.filter((block) => block.type === 'video').length;
      const channelMatch = media.blocks.some((block) => block.type === 'video')
        ? null
        : matchVideo(
            lesson.title,
            (input.channelVideos ?? []).filter((video) => !usedVideos.has(video.id))
          );
      if (channelMatch) {
        usedVideos.add(channelMatch.video.id);
        media.blocks.push({
          type: 'video',
          provider: 'YouTube',
          url: channelMatch.video.url,
          title: channelMatch.video.title,
          citation: null
        });
      }
      stats.videos += channelMatch ? 1 : 0;
      const { uncitedParagraphs: _uncited, ...packageLesson } = lesson;
      lessons.push({ ...packageLesson, blocks: media.blocks });
    }

    const check = checkResults[index];
    if (!check) issues.push(`Section "${brief.section.title}": its check could not be written.`);
    stats.droppedQuestions += check?.problems.length ?? 0;
    sections.push({ key: section.key, title: section.title, lessons, check: check?.questions ?? [] });
  }

  const finalQuiz = await quiz.catch(() => null);
  if (!finalQuiz) issues.push('The final quiz could not be written.');
  stats.droppedQuestions += finalQuiz?.problems.length ?? 0;

  const course: PackageCourse = {
    key: input.plan.course.key,
    title: input.plan.title,
    description: input.plan.description,
    audience: input.plan.course.audience,
    outcomes: input.plan.outcomes,
    sections,
    finalQuiz: finalQuiz?.finalQuiz ?? [],
    practiceTasks: finalQuiz?.practiceTasks ?? []
  };
  const valid = ZPackageCourse.safeParse(course);
  if (!valid.success)
    issues.push(...valid.error.issues.map((issue) => `Package: ${issue.path.join('.')}: ${issue.message}`));

  return { course, gaps, issues, stats };
}

export const LABELS_SYSTEM = [
  'Translate the fixed labels of a training course into the language given.',
  'Keep {section} and {course} exactly as they are. Short, natural wording a course in that language would use.'
].join('\n');

/** The labels a host adds around generated content, in the course's language: English as written, any other translated once. */
export async function packageLabels(
  caller: StructuredCaller,
  locale: string,
  signal?: AbortSignal
): Promise<PackageLabels> {
  if (/^en\b/i.test(locale)) return ENGLISH_PACKAGE_LABELS;

  const ZLabelsDraft = z.object({
    source: z.string(),
    note: z.string(),
    tip: z.string(),
    warning: z.string(),
    sectionCheck: z.string(),
    finalQuiz: z.string(),
    practice: z.string(),
    outcomes: z.string()
  });
  const draft = await caller.structured({
    role: 'writer',
    system: LABELS_SYSTEM,
    content: [
      { type: 'text', text: `Language: ${locale}\nLabels:\n${JSON.stringify(ENGLISH_PACKAGE_LABELS, null, 2)}` }
    ],
    schema: ZLabelsDraft,
    maxTokens: 2_000,
    signal
  });
  const labels = ZPackageLabels.safeParse(draft);

  return labels.success ? labels.data : ENGLISH_PACKAGE_LABELS;
}
