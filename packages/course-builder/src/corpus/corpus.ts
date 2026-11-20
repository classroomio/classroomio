import { createHash } from 'node:crypto';

import { baseLanguage, sameLanguage } from '../read/locale';
import type { SourcePage } from '../sources/types';
import { blocksFromContent } from './blocks';
import { exclusionFor, isReferenceOnly } from './exclude';
import { EXCLUSION_REASONS, type Corpus, type CorpusBlock, type CorpusPage, type ExclusionReason } from './types';

/** Pages below this many words teach nothing: navigation stubs, "coming soon" placeholders, image-only pages. */
export const MIN_PAGE_WORDS = 40;

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function wordCount(blocks: CorpusBlock[]): number {
  return blocks.reduce((total, block) => total + (block.text.match(/\S+/g)?.length ?? 0), 0);
}

function withIds(pageHash8: string, drafts: ReturnType<typeof blocksFromContent>): CorpusBlock[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: `${pageHash8}-${index}-${hash(draft.text).slice(0, 8)}`
  }));
}

/** "New" written as a version marker, not as an ordinary word: "(New)", "[New]", "New:", "– New", "NEW". */
const NEW_MARKERS = [/\(new\)|\[new\]/gi, /^\s*new\s*[:\-–—]\s*/i, /\s[-–—]\s*new\s*$/i, /\bNEW\b/g];

function withoutNewMarker(title: string): string {
  return NEW_MARKERS.reduce((text, marker) => text.replace(marker, ' '), title);
}

/**
 * The title with a "new" marker, a version number and a year removed, so a page and its replacement compare equal.
 * "Create a new job" keeps its "new": only a marker means a replacement.
 */
export function titleKey(title: string): string {
  return withoutNewMarker(title)
    .toLowerCase()
    .replace(/\bv\d+(?:\.\d+)*\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface CorpusCandidate {
  page: CorpusPage;
  updatedAt: string | null;
  labels: string[];
}

function plainTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function markedNew(candidate: CorpusCandidate): boolean {
  const title = candidate.page.title;

  return withoutNewMarker(title) !== title || candidate.labels.some((label) => /^\s*new\s*$/i.test(label));
}

const TITLE_VERSION = /\bv(\d+(?:\.\d+)*)\b/i;
const TITLE_YEAR = /\b(20\d{2})\b/;

/** The version or year a title names, as numbers to compare: "Manage tasks (v6)" → [6], "2026 Releases" → [2026]. */
function titleVersion(title: string): number[] {
  const match = title.match(TITLE_VERSION) ?? title.match(TITLE_YEAR);

  return match ? match[1].split('.').map(Number) : [];
}

function compareVersions(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference) return difference;
  }

  return 0;
}

/**
 * Newest first: the higher version or year its title names (a title without one counts as the oldest), then the later
 * update, then a "new" marker, then reading order. A site that keeps its old version's pages may update them later.
 */
function newerFirst(left: CorpusCandidate, right: CorpusCandidate): number {
  const versionOrder = compareVersions(titleVersion(right.page.title), titleVersion(left.page.title));
  if (versionOrder) return versionOrder;

  const leftDate = left.updatedAt ?? '';
  const rightDate = right.updatedAt ?? '';
  if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
  if (markedNew(left) !== markedNew(right)) return markedNew(left) ? -1 : 1;

  return left.page.order - right.page.order;
}

/**
 * Turns a source's pages into the corpus: ordered blocks with stable ids, exclusions recorded per page, and one page
 * kept where several carry the same text.
 */
export function buildCorpus(pages: SourcePage[], locale: string): Corpus {
  const excluded = Object.fromEntries(EXCLUSION_REASONS.map((reason) => [reason, 0])) as Record<
    ExclusionReason,
    number
  >;
  const candidates: CorpusCandidate[] = [];

  for (const page of pages) {
    if (page.kind !== 'page' || !page.content) continue;

    const drafts = blocksFromContent(page.content, page.url);
    const contentHash = hash(drafts.map((draft) => draft.text.replace(/\s+/g, ' ').trim()).join('\n')).slice(0, 16);
    const blocks = withIds(contentHash.slice(0, 8), drafts);
    const words = wordCount(blocks);
    const structural = exclusionFor(page);

    const corpusPage: CorpusPage = {
      pageId: page.id,
      url: page.url,
      title: page.title,
      path: page.path,
      order: page.order,
      contentHash,
      blocks,
      wordCount: words,
      excluded: structural,
      referenceOnly: isReferenceOnly(structural)
    };

    if (!structural && !sameLanguage(page.locale, baseLanguage(locale))) corpusPage.excluded = 'other-locale';
    if (!corpusPage.excluded && !corpusPage.referenceOnly && words < MIN_PAGE_WORDS) corpusPage.excluded = 'too-short';

    candidates.push({ page: corpusPage, updatedAt: page.updatedAt, labels: page.labels });
  }

  const live = candidates.filter((candidate) => !candidate.page.excluded);
  resolveReplaced(live);
  resolveDuplicates(live);

  for (const candidate of candidates) {
    if (candidate.page.excluded) excluded[candidate.page.excluded] += 1;
  }

  return {
    locale,
    pages: candidates.map((candidate) => candidate.page).sort((left, right) => left.order - right.order),
    excluded
  };
}

/** Where a page and its "new" version both survive, keeps the newer one and excludes the other as obsolete. */
function resolveReplaced(candidates: CorpusCandidate[]): void {
  const groups = new Map<string, CorpusCandidate[]>();

  for (const candidate of candidates) {
    const key = titleKey(candidate.page.title);
    if (!key) continue;

    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    if (new Set(group.map((candidate) => plainTitle(candidate.page.title))).size === 1) continue;

    const [, ...replaced] = [...group].sort(newerFirst);
    for (const candidate of replaced) {
      candidate.page.excluded = 'obsolete';
    }
  }
}

/** Keeps the page seen first in reading order where two pages carry the same cleaned text. */
function resolveDuplicates(candidates: CorpusCandidate[]): void {
  const seen = new Map<string, CorpusCandidate>();

  for (const candidate of [...candidates].sort((left, right) => left.page.order - right.page.order)) {
    if (candidate.page.excluded) continue;

    const original = seen.get(candidate.page.contentHash);
    if (original) {
      candidate.page.excluded = 'duplicate';
      continue;
    }

    seen.set(candidate.page.contentHash, candidate);
  }
}

/** The pages a course may teach from: everything not excluded and not kept only as a naming reference. */
export function teachablePages(corpus: Corpus): CorpusPage[] {
  return corpus.pages.filter((page) => !page.excluded && !page.referenceOnly);
}
