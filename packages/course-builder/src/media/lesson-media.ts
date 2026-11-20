import * as cheerio from 'cheerio';

import type { CorpusBlock } from '../corpus/types';
import type { Fetcher } from '../fetch/types';
import type { Citation, LessonBlock } from '../package/schema';
import type { BriefLesson } from '../plan/briefs';

export interface VideoInfo {
  title: string;
  provider: string;
}

export interface MediaOptions {
  fetchedAt: string;
  /** Where the host stored its copy of an image (the reader's `captureImage`); null keeps the image out. */
  storedImageUrl?: (sourceUrl: string) => string | null;
  /** The video's title and provider, from its oEmbed answer; null keeps the video out. */
  videoInfo?: (url: string) => Promise<VideoInfo | null>;
}

const DECORATION = /\b(logo|icon|avatar|favicon|badge|spinner)\b/i;

function isDecoration(block: CorpusBlock): boolean {
  const fileName = block.imageUrl ? (new URL(block.imageUrl).pathname.split('/').pop() ?? '') : '';

  return DECORATION.test(block.text) || DECORATION.test(fileName.replace(/[-_.]/g, ' '));
}

function citationOf(source: BriefLesson['sources'][number], block: CorpusBlock, fetchedAt: string): Citation {
  return { pageUrl: source.url, blockIds: [block.id], contentHash: source.contentHash, fetchedAt };
}

async function mediaBlock(
  source: BriefLesson['sources'][number],
  block: CorpusBlock,
  options: MediaOptions
): Promise<LessonBlock | null> {
  if (block.kind === 'image') {
    if (!block.imageUrl || isDecoration(block)) return null;

    const url = options.storedImageUrl ? options.storedImageUrl(block.imageUrl) : block.imageUrl;
    if (!url) return null;

    return {
      type: 'image',
      url,
      sourceUrl: source.url,
      alt: block.text,
      citation: citationOf(source, block, options.fetchedAt)
    };
  }

  const videoUrl = block.text.trim();
  if (!videoUrl || !options.videoInfo) return null;

  const info = await options.videoInfo(videoUrl).catch(() => null);
  if (!info) return null;

  return {
    type: 'video',
    provider: info.provider,
    url: videoUrl,
    title: info.title,
    citation: citationOf(source, block, options.fetchedAt)
  };
}

function citesBlock(block: LessonBlock, blockId: string): boolean {
  if (block.type === 'text' || block.type === 'callout') {
    return block.citations.some((citation) => citation.blockIds.includes(blockId));
  }

  return false;
}

function lastIndexCiting(blocks: LessonBlock[], blockId: string): number {
  for (let index = blocks.length - 1; index >= 0; index--) if (citesBlock(blocks[index], blockId)) return index;

  return -1;
}

/**
 * Adds the screenshots and embedded videos of a lesson's cited block ranges, each right after the lesson block that
 * cites the source block before it (the step it illustrates), else at the end. Never makes or alters an image.
 */
export async function withLessonMedia(
  blocks: LessonBlock[],
  lesson: BriefLesson,
  options: MediaOptions
): Promise<{ blocks: LessonBlock[]; skipped: number }> {
  const placed = [...blocks];
  const seen = new Set<string>();
  let skipped = 0;

  for (const source of lesson.sources) {
    let previousTextId: string | null = null;

    for (const block of source.blocks) {
      if (block.kind !== 'image' && block.kind !== 'video') {
        previousTextId = block.id;
        continue;
      }

      const key = block.imageUrl ?? block.text;
      if (seen.has(key)) continue;

      seen.add(key);
      const media = await mediaBlock(source, block, options);
      if (!media) {
        skipped += 1;
        continue;
      }

      const anchor = previousTextId ? lastIndexCiting(placed, previousTextId) : -1;
      let at = anchor < 0 ? placed.length : anchor + 1;
      while (anchor >= 0 && at < placed.length && (placed[at].type === 'image' || placed[at].type === 'video')) at += 1;
      placed.splice(at, 0, media);
    }
  }

  return { blocks: placed, skipped };
}

/**
 * A video's title and provider from the oEmbed link its player page advertises, so any player is recognised without a
 * list of providers. Null when the page advertises none or the answer is not a usable video.
 */
export async function oembedInfo(fetcher: Fetcher, videoUrl: string): Promise<VideoInfo | null> {
  const page = await fetcher.get(videoUrl);
  if (page.status !== 200) return null;

  const href = cheerio.load(page.body)('link[type="application/json+oembed"]').attr('href');
  if (!href) return null;

  const answer = await fetcher.get(new URL(href, page.url).href, { accept: 'application/json' });
  if (answer.status !== 200) return null;

  try {
    const data = JSON.parse(answer.body) as { title?: unknown; provider_name?: unknown; type?: unknown };
    if (typeof data.title !== 'string' || !data.title.trim()) return null;
    if (data.type !== undefined && data.type !== 'video' && data.type !== 'rich') return null;

    const provider =
      typeof data.provider_name === 'string' && data.provider_name ? data.provider_name : new URL(videoUrl).hostname;

    return { title: data.title.trim(), provider };
  } catch {
    return null;
  }
}
