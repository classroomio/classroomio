import type { CorpusBlock, CorpusPage } from '../corpus/types';
import type { GlossaryEntry } from '../understand/glossary';
import type { CoursePlan, LessonSource, PlannedSection } from './sections';

export interface BriefLesson {
  key: string;
  title: string;
  /** The blocks each source covers, in page order: the only material the lesson may teach from. */
  sources: Array<LessonSource & { url: string; title: string; contentHash: string; blocks: CorpusBlock[] }>;
}

export interface SectionBrief {
  courseKey: string;
  courseTitle: string;
  section: Omit<PlannedSection, 'lessons'>;
  lessons: BriefLesson[];
  /** Titles of the course's other sections, so the writer does not teach their topics. */
  siblingTitles: string[];
  glossary: GlossaryEntry[];
}

function blocksOf(page: CorpusPage, source: LessonSource): CorpusBlock[] {
  const from = source.fromBlockId ? page.blocks.findIndex((block) => block.id === source.fromBlockId) : 0;
  const to = source.toBlockId
    ? page.blocks.findIndex((block) => block.id === source.toBlockId)
    : page.blocks.length - 1;

  return page.blocks.slice(Math.max(from, 0), (to < 0 ? page.blocks.length - 1 : to) + 1);
}

/** One brief per section of a planned course: its lessons with the exact blocks they may use, and the names to use. */
export function sectionBriefs(
  plan: CoursePlan,
  pages: ReadonlyMap<string, CorpusPage>,
  glossary: GlossaryEntry[]
): SectionBrief[] {
  return plan.sections.map((section) => {
    const lessons = section.lessons.map((lesson) => ({
      key: lesson.key,
      title: lesson.title,
      sources: lesson.sources.flatMap((source) => {
        const page = pages.get(source.pageId);

        return page
          ? [
              {
                ...source,
                url: page.url,
                title: page.title,
                contentHash: page.contentHash,
                blocks: blocksOf(page, source)
              }
            ]
          : [];
      })
    }));
    const pageIds = new Set(lessons.flatMap((lesson) => lesson.sources.map((source) => source.pageId)));
    const { lessons: _lessons, ...sectionFields } = section;

    return {
      courseKey: plan.course.key,
      courseTitle: plan.title,
      section: sectionFields,
      lessons,
      siblingTitles: plan.sections.filter((other) => other.key !== section.key).map((other) => other.title),
      glossary: glossary.filter((entry) => entry.pageIds.some((pageId) => pageIds.has(pageId)))
    };
  });
}

/**
 * The source ranges the claim checker reads for each lesson, by lesson key: the lesson's own first, then the rest of its
 * section's, which the writer also saw. Media blocks are left out.
 */
export function lessonSources(
  briefs: SectionBrief[]
): Map<
  string,
  Array<{ url: string; title: string; contentHash: string; blocks: Array<{ id: string; text: string }> }>
> {
  const rangeKey = (source: BriefLesson['sources'][number]) =>
    `${source.pageId}#${source.fromBlockId ?? ''}#${source.toBlockId ?? ''}`;
  const readable = (source: BriefLesson['sources'][number]) => ({
    url: source.url,
    title: source.title,
    contentHash: source.contentHash,
    blocks: source.blocks
      .filter((block) => block.kind !== 'image' && block.kind !== 'video' && block.text.trim())
      .map((block) => ({ id: block.id, text: block.text }))
  });

  return new Map(
    briefs.flatMap((brief) =>
      brief.lessons.map((lesson) => {
        const ordered = [...lesson.sources, ...brief.lessons.flatMap((other) => other.sources)];
        const unique = [...new Map(ordered.map((source) => [rangeKey(source), source])).values()];

        return [lesson.key, unique.map(readable)];
      })
    )
  );
}
