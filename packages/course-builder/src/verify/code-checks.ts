import type { Citation, PackageCourse, PackageLesson } from '../package/schema';
import { lessonTarget, type BlockLookup, type CheckIssue } from './types';

export interface CodeCheckContext {
  blocks: BlockLookup;
  /** Every URL a lesson may link to or embed: the pages read and the videos verified for this build. */
  allowedUrls: ReadonlySet<string>;
  /**
   * Product names from the page cards. When given, every name a lesson sets in bold or quotes must be one of them or
   * appear in the blocks the lesson cites.
   */
  glossary?: ReadonlySet<string>;
  /** Titles of the build's other courses. A lesson never refers to another course. */
  otherCourseTitles: string[];
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';

    return parsed.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function lessonCitations(lesson: PackageLesson): Citation[] {
  return lesson.blocks.flatMap((block) => {
    if (block.type === 'text' || block.type === 'callout') return block.citations;
    if (block.type === 'image') return [block.citation];

    return block.citation ? [block.citation] : [];
  });
}

function lessonHtml(lesson: PackageLesson): string {
  return lesson.blocks.map((block) => (block.type === 'text' || block.type === 'callout' ? block.html : '')).join('\n');
}

function linksIn(lesson: PackageLesson): string[] {
  const hrefs = [...lessonHtml(lesson).matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  const videos = lesson.blocks.flatMap((block) => (block.type === 'video' ? [block.url] : []));

  return [...hrefs.filter((href) => /^https?:/i.test(href)), ...videos];
}

function emphasisedNames(lesson: PackageLesson): string[] {
  const html = lessonHtml(lesson);
  const bold = [...html.matchAll(/<(?:strong|b)>([^<]{1,60})<\/(?:strong|b)>/gi)].map((match) => match[1]);
  const quoted = [...html.replace(/<[^>]+>/g, ' ').matchAll(/[“"]([^”"]{1,60})[”"]/g)].map((match) => match[1]);

  return [...bold, ...quoted].map((name) => name.trim().replace(/[.:,]$/, '')).filter(Boolean);
}

function citedText(lesson: PackageLesson, blocks: BlockLookup): string {
  return lessonCitations(lesson)
    .flatMap((citation) => citation.blockIds.map((id) => blocks.get(id)?.text ?? ''))
    .join('\n')
    .toLowerCase();
}

/** The checks of one lesson that need no model: links and videos, citations, product names, other courses. */
export function lessonCodeChecks(lesson: PackageLesson, context: CodeCheckContext): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const allowed = new Set([...context.allowedUrls].map(normalizeUrl));
  const glossary = context.glossary ? new Set([...context.glossary].map((name) => name.toLowerCase())) : null;

  const target = lessonTarget(lesson.key);
  const text = lessonHtml(lesson)
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();

  for (const url of linksIn(lesson)) {
    if (!allowed.has(normalizeUrl(url)))
      issues.push({ target, kind: 'unknown-link', reason: `links to ${url}, which was not read or verified` });
  }

  for (const citation of lessonCitations(lesson)) {
    for (const id of citation.blockIds) {
      const block = context.blocks.get(id);
      if (!block)
        issues.push({ target, kind: 'missing-block', reason: `cites block ${id}, which is not in the corpus` });
      else if (block.excluded)
        issues.push({
          target,
          kind: 'excluded-citation',
          reason: `cites ${block.pageUrl}, excluded as ${block.excluded}`
        });
    }
  }

  if (glossary) {
    const cited = citedText(lesson, context.blocks);
    for (const name of emphasisedNames(lesson)) {
      if (!glossary.has(name.toLowerCase()) && !cited.includes(name.toLowerCase()))
        issues.push({
          target,
          kind: 'unknown-name',
          reason: `names "${name}", which neither the glossary nor the cited text uses`
        });
    }
  }

  for (const title of context.otherCourseTitles) {
    if (title.trim() && text.includes(title.toLowerCase()))
      issues.push({ target, kind: 'other-course', reason: `mentions the course "${title}"` });
  }

  return [...new Map(issues.map((issue) => [`${issue.target}|${issue.kind}|${issue.reason}`, issue])).values()];
}

/** The code checks of every lesson of a course. */
export function codeChecks(course: PackageCourse, context: CodeCheckContext): CheckIssue[] {
  return course.sections.flatMap((section) => section.lessons.flatMap((lesson) => lessonCodeChecks(lesson, context)));
}

/** The lesson with every link to a page that was not read or verified turned into its plain text. */
export function withoutUnreadLinks(lesson: PackageLesson, allowedUrls: ReadonlySet<string>): PackageLesson {
  const allowed = new Set([...allowedUrls].map(normalizeUrl));
  const unlink = (html: string) =>
    html.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (anchor, href: string, text: string) =>
      /^https?:/i.test(href) && !allowed.has(normalizeUrl(href)) ? text : anchor
    );

  return {
    ...lesson,
    blocks: lesson.blocks.map((block) =>
      block.type === 'text' || block.type === 'callout' ? { ...block, html: unlink(block.html) } : block
    )
  };
}

/** The lesson without the videos that were not verified. */
export function withoutUnverifiedVideos(lesson: PackageLesson, allowedUrls: ReadonlySet<string>): PackageLesson {
  const allowed = new Set([...allowedUrls].map(normalizeUrl));

  return {
    ...lesson,
    blocks: lesson.blocks.filter((block) => block.type !== 'video' || allowed.has(normalizeUrl(block.url)))
  };
}

/** The lesson with citations of blocks that are not in the corpus, or sit on excluded pages, taken out. */
export function withoutBadCitations(lesson: PackageLesson, blocks: BlockLookup): PackageLesson {
  const kept = (citations: Citation[]) =>
    citations
      .map((citation) => ({
        ...citation,
        blockIds: citation.blockIds.filter((id) => {
          const block = blocks.get(id);

          return !!block && !block.excluded;
        })
      }))
      .filter((citation) => citation.blockIds.length);

  return {
    ...lesson,
    blocks: lesson.blocks.map((block) =>
      block.type === 'text' || block.type === 'callout' ? { ...block, citations: kept(block.citations) } : block
    )
  };
}
