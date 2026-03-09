import * as schema from '../schema';

import { and, asc, db, desc, eq, sql } from '../drizzle';

import type { DbOrTxClient } from '../drizzle';

type LessonVideo = {
  type?: unknown;
  link?: unknown;
  key?: unknown;
  fileName?: unknown;
  assetId?: unknown;
  metadata?: unknown;
};

type LessonDocument = {
  type?: unknown;
  name?: unknown;
  link?: unknown;
  size?: unknown;
  key?: unknown;
  assetId?: unknown;
  metadata?: unknown;
};

type AssetKind = 'video' | 'document' | 'image' | 'audio' | 'other';
type AssetProvider = 'upload' | 'youtube' | 'generic' | 'external_url';
type SlotType = 'lesson_video' | 'lesson_document';

type MediaSummaryKey =
  | 'skippedMalformed'
  | 'skippedMissingKey'
  | 'skippedMissingLink'
  | 'skippedUnsupportedType'
  | 'skippedMissingOrganization'
  | 'errors';

interface BackfillSummary {
  lessonsScanned: number;
  mediaItemsScanned: number;
  mediaItemsEligible: number;
  assetsCreated: number;
  assetsReused: number;
  usagesCreated: number;
  usagesReused: number;
  lessonItemsPatchedWithAssetId: number;
  assetsWithByteSize: number;
  assetsMissingByteSize: number;
  youtubeMetadataResolved: number;
  youtubeAssetsUpdated: number;
  skippedMalformed: number;
  skippedMissingKey: number;
  skippedMissingLink: number;
  skippedUnsupportedType: number;
  skippedMissingOrganization: number;
  errors: number;
}

interface SampleRow {
  lessonId: string;
  slotType: SlotType;
  index: number;
  kind: AssetKind;
  provider: AssetProvider;
  storageKey: string | null;
  sourceUrl: string | null;
  assetId: string;
  patched: boolean;
}

interface NormalizedAssetCandidate {
  slotType: SlotType;
  position: number;
  existingAssetId: string | null;
  kind: AssetKind;
  provider: AssetProvider;
  storageProvider: string;
  storageKey: string | null;
  sourceUrl: string | null;
  mimeType: string | null;
  byteSize: number | null;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  aspectRatio: string | null;
  isExternal: boolean;
  metadata: Record<string, unknown>;
}

interface ResolvedAssetResult {
  id: string;
  created: boolean;
  byteSize: number | null;
  synthetic: boolean;
}

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has('--execute');
const isDryRun = !shouldExecute || args.has('--dry-run');
const batchSize = 200;
const dryRunIdPrefix = '__dryrun_asset__';
const fallbackOrganizationIdArg =
  process.argv.find((arg) => arg.startsWith('--organization-id='))?.split('=')[1] ?? null;
const fallbackOrganizationId =
  fallbackOrganizationIdArg ??
  (process.argv.includes('--organization-id')
    ? (process.argv[process.argv.indexOf('--organization-id') + 1] ?? null)
    : null);

const summary: BackfillSummary = {
  lessonsScanned: 0,
  mediaItemsScanned: 0,
  mediaItemsEligible: 0,
  assetsCreated: 0,
  assetsReused: 0,
  usagesCreated: 0,
  usagesReused: 0,
  lessonItemsPatchedWithAssetId: 0,
  assetsWithByteSize: 0,
  assetsMissingByteSize: 0,
  youtubeMetadataResolved: 0,
  youtubeAssetsUpdated: 0,
  skippedMalformed: 0,
  skippedMissingKey: 0,
  skippedMissingLink: 0,
  skippedUnsupportedType: 0,
  skippedMissingOrganization: 0,
  errors: 0
};

const sampleRows: SampleRow[] = [];

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asNonNegativeInt(value: unknown): number | null {
  const parsed = asNumber(value);
  if (parsed == null) {
    return null;
  }

  return Math.max(0, Math.round(parsed));
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  const parsed = asObject(value);
  return parsed ?? {};
}

function mapVideoTypeToProvider(
  type: string | null,
  options: { hasStorageKey: boolean; hasSourceLink: boolean }
): AssetProvider | null {
  if (type === 'upload') return 'upload';
  if (type === 'youtube') return 'youtube';
  if (type === 'generic') return 'generic';
  if (type === 'external_url') return 'external_url';

  // Legacy fallback: infer provider from available fields when type is missing/unknown.
  if (options.hasStorageKey) return 'upload';
  if (options.hasSourceLink) return 'external_url';

  return null;
}

function mapDocumentTypeToMimeType(type: string | null): string | null {
  if (!type) return null;

  const normalized = type.trim().toLowerCase();
  const explicitMimePrefix =
    normalized.startsWith('application/') ||
    normalized.startsWith('image/') ||
    normalized.startsWith('audio/') ||
    normalized.startsWith('video/');

  if (explicitMimePrefix) return normalized;

  const byAlias: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm'
  };

  return byAlias[normalized] ?? null;
}

function getMimeTypeFromFileName(nameOrLink: string | null): string | null {
  if (!nameOrLink) return null;

  const noQuery = nameOrLink.split('?')[0];
  const extension = noQuery.split('.').pop()?.trim().toLowerCase() ?? '';
  if (!extension) return null;

  return mapDocumentTypeToMimeType(extension);
}

function mapMimeTypeToAssetKind(mimeType: string | null): AssetKind {
  if (!mimeType) return 'other';

  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('application/')) return 'document';
  if (mimeType.startsWith('text/')) return 'document';

  return 'other';
}

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const youtubeMetadataCache = new Map<
  string,
  Promise<{
    videoId: string;
    sourceUrl: string;
    title: string | null;
    durationSeconds: number | null;
    thumbnailUrl: string | null;
  } | null>
>();

function normalizeUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function extractYouTubeVideoId(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const parsedUrl = normalizeUrl(url);
  if (!parsedUrl) {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  let videoId: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const [pathSegment] = parsedUrl.pathname.split('/').filter(Boolean);
    videoId = pathSegment ?? null;
  } else if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'www.youtube-nocookie.com'
  ) {
    if (parsedUrl.pathname === '/watch') {
      videoId = parsedUrl.searchParams.get('v');
    } else {
      const [firstSegment, secondSegment] = parsedUrl.pathname.split('/').filter(Boolean);
      if (firstSegment === 'embed' || firstSegment === 'shorts' || firstSegment === 'live') {
        videoId = secondSegment ?? null;
      }
    }
  }

  if (!videoId || !YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
    return null;
  }

  return videoId;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMetaContent(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  const value = match?.[1];
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value.trim());
  return decoded.length ? decoded : null;
}

function extractDurationSeconds(html: string): number | null {
  const lengthSecondsMatch = html.match(/"lengthSeconds":"(\d+)"/);
  if (lengthSecondsMatch?.[1]) {
    const parsed = Number.parseInt(lengthSecondsMatch[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const approxDurationMsMatch = html.match(/"approxDurationMs":"(\d+)"/);
  if (approxDurationMsMatch?.[1]) {
    const parsed = Number.parseInt(approxDurationMsMatch[1], 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.round(parsed / 1000);
    }
  }

  return null;
}

function isYouTubeUrlLike(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('youtube.com/') ||
    normalized.startsWith('www.youtube.com/') ||
    normalized.startsWith('youtu.be/') ||
    normalized.includes('youtube.com/watch?v=')
  );
}

function sourceUrlsReferToSameYouTubeVideo(first: string | null, second: string | null): boolean {
  const firstId = extractYouTubeVideoId(first);
  const secondId = extractYouTubeVideoId(second);

  return Boolean(firstId && secondId && firstId === secondId);
}

async function fetchYouTubeOEmbed(sourceUrl: string): Promise<{ title: string | null; thumbnailUrl: string | null }> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(sourceUrl)}`);
    if (!response.ok) {
      return {
        title: null,
        thumbnailUrl: null
      };
    }

    const json = (await response.json()) as {
      title?: unknown;
      thumbnail_url?: unknown;
    };
    const title = typeof json.title === 'string' && json.title.trim().length ? json.title.trim() : null;
    const thumbnailUrl =
      typeof json.thumbnail_url === 'string' && json.thumbnail_url.trim().length ? json.thumbnail_url.trim() : null;

    return {
      title,
      thumbnailUrl
    };
  } catch {
    return {
      title: null,
      thumbnailUrl: null
    };
  }
}

async function fetchYouTubeWatchPageMetadata(videoId: string): Promise<{
  title: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      return {
        title: null,
        durationSeconds: null,
        thumbnailUrl: null
      };
    }

    const html = await response.text();
    const title =
      extractMetaContent(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i) ??
      extractMetaContent(html, /<meta\s+name="title"\s+content="([^"]+)"/i);

    return {
      title,
      durationSeconds: extractDurationSeconds(html),
      thumbnailUrl: extractMetaContent(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i)
    };
  } catch {
    return {
      title: null,
      durationSeconds: null,
      thumbnailUrl: null
    };
  }
}

async function resolveYouTubeMetadata(sourceUrl: string | null): Promise<{
  videoId: string;
  sourceUrl: string;
  title: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
} | null> {
  const videoId = extractYouTubeVideoId(sourceUrl);
  if (!videoId) {
    return null;
  }

  const cached = youtubeMetadataCache.get(videoId);
  if (cached) {
    return cached;
  }

  const task = (async () => {
    const canonicalSourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const [oembed, watchMetadata] = await Promise.all([
      fetchYouTubeOEmbed(canonicalSourceUrl),
      fetchYouTubeWatchPageMetadata(videoId)
    ]);

    if (
      oembed.title ||
      watchMetadata.title ||
      watchMetadata.durationSeconds ||
      oembed.thumbnailUrl ||
      watchMetadata.thumbnailUrl
    ) {
      summary.youtubeMetadataResolved += 1;
    }

    return {
      videoId,
      sourceUrl: canonicalSourceUrl,
      title: oembed.title ?? watchMetadata.title,
      durationSeconds: watchMetadata.durationSeconds,
      thumbnailUrl:
        oembed.thumbnailUrl ?? watchMetadata.thumbnailUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  })();

  youtubeMetadataCache.set(videoId, task);
  return task;
}

function buildDryRunAssetId(params: { lessonId: string; slotType: SlotType; index: number }): string {
  return `${dryRunIdPrefix}${params.lessonId}:${params.slotType}:${params.index}`;
}

function normalizeVideoCandidate(
  rawVideo: LessonVideo,
  index: number,
  increment: (key: MediaSummaryKey) => void
): NormalizedAssetCandidate | null {
  const storageKey = asString(rawVideo.key);
  const sourceLink = asString(rawVideo.link);
  const type = asString(rawVideo.type);
  const metadata = normalizeMetadata(rawVideo.metadata);
  const existingAssetId = asString(rawVideo.assetId);
  const fileName = asString(rawVideo.fileName);
  const provider = mapVideoTypeToProvider(type, {
    hasStorageKey: Boolean(storageKey),
    hasSourceLink: Boolean(sourceLink)
  });

  if (!provider) {
    increment('skippedUnsupportedType');
    return null;
  }

  if (provider === 'upload' && !storageKey) {
    increment('skippedMissingKey');
    return null;
  }

  if (provider !== 'upload' && !sourceLink) {
    increment('skippedMissingLink');
    return null;
  }

  const metadataMimeType = asString(metadata.mimeType);
  const mimeType = metadataMimeType ?? getMimeTypeFromFileName(fileName ?? sourceLink);
  const inferredKind = mapMimeTypeToAssetKind(mimeType);
  const defaultTitle = provider === 'youtube' ? 'YouTube video' : sourceLink;

  return {
    slotType: 'lesson_video',
    position: index,
    existingAssetId,
    kind: inferredKind === 'other' ? 'video' : inferredKind,
    provider,
    storageProvider: provider === 'upload' ? 's3' : 'external',
    storageKey: provider === 'upload' ? storageKey : null,
    sourceUrl: sourceLink,
    mimeType,
    byteSize: asNumber(metadata.byteSize),
    title: fileName ?? asString(metadata.title) ?? defaultTitle,
    description: asString(metadata.description),
    thumbnailUrl: asString(metadata.thumbnailUrl),
    durationSeconds: asNonNegativeInt(metadata.duration) ?? asNonNegativeInt(metadata.durationSeconds),
    aspectRatio: asString(metadata.aspectRatio),
    isExternal: provider !== 'upload',
    metadata
  };
}

function normalizeDocumentCandidate(
  rawDocument: LessonDocument,
  index: number,
  increment: (key: MediaSummaryKey) => void
): NormalizedAssetCandidate | null {
  const metadata = normalizeMetadata(rawDocument.metadata);
  const storageKey = asString(rawDocument.key);
  const sourceLink = asString(rawDocument.link);
  const existingAssetId = asString(rawDocument.assetId);
  const name = asString(rawDocument.name);
  const explicitType = asString(rawDocument.type);

  if (!storageKey && !sourceLink) {
    increment('skippedMissingLink');
    return null;
  }

  const provider: AssetProvider = storageKey ? 'upload' : 'external_url';
  const metadataMimeType = asString(metadata.mimeType);
  const aliasMimeType = mapDocumentTypeToMimeType(explicitType);
  const fileNameMimeType = getMimeTypeFromFileName(name ?? sourceLink);
  const mimeType = metadataMimeType ?? aliasMimeType ?? fileNameMimeType;
  const inferredKind = mapMimeTypeToAssetKind(mimeType);

  return {
    slotType: 'lesson_document',
    position: index,
    existingAssetId,
    kind: inferredKind === 'other' ? 'document' : inferredKind,
    provider,
    storageProvider: provider === 'upload' ? 's3' : 'external',
    storageKey,
    sourceUrl: sourceLink,
    mimeType,
    byteSize: asNumber(rawDocument.size) ?? asNumber(metadata.byteSize),
    title: name ?? sourceLink,
    description: asString(metadata.description),
    thumbnailUrl: asString(metadata.thumbnailUrl),
    durationSeconds: asNonNegativeInt(metadata.duration),
    aspectRatio: asString(metadata.aspectRatio),
    isExternal: provider !== 'upload',
    metadata: {
      ...metadata,
      originalType: explicitType
    }
  };
}

async function enrichYouTubeCandidate(candidate: NormalizedAssetCandidate): Promise<NormalizedAssetCandidate> {
  if (candidate.provider !== 'youtube') {
    return candidate;
  }

  const resolved = await resolveYouTubeMetadata(candidate.sourceUrl);
  if (!resolved) {
    return candidate;
  }

  return {
    ...candidate,
    sourceUrl: resolved.sourceUrl,
    title: resolved.title ?? candidate.title ?? 'YouTube video',
    thumbnailUrl: resolved.thumbnailUrl ?? candidate.thumbnailUrl,
    durationSeconds: resolved.durationSeconds ?? candidate.durationSeconds,
    metadata: {
      ...candidate.metadata,
      videoId: resolved.videoId,
      title: resolved.title ?? candidate.title ?? undefined,
      duration: resolved.durationSeconds ?? candidate.durationSeconds ?? undefined,
      thumbnailUrl: resolved.thumbnailUrl ?? candidate.thumbnailUrl ?? undefined
    }
  };
}

async function maybeUpdateYouTubeAssetMetadata(
  dbClient: DbOrTxClient,
  params: {
    execute: boolean;
    organizationId: string;
    assetId: string;
    candidate: NormalizedAssetCandidate;
  }
) {
  const { execute, organizationId, assetId, candidate } = params;
  if (candidate.provider !== 'youtube') {
    return;
  }

  const [asset] = await dbClient
    .select()
    .from(schema.asset)
    .where(and(eq(schema.asset.id, assetId), eq(schema.asset.organizationId, organizationId)))
    .limit(1);

  if (!asset) {
    return;
  }

  const mergedMetadata = {
    ...(asObject(asset.metadata) ?? {}),
    ...candidate.metadata
  };
  const candidateTitle = candidate.title ?? null;
  const shouldUpdateTitle =
    candidateTitle != null &&
    candidateTitle.trim().length > 0 &&
    (!asset.title ||
      asset.title.trim().length === 0 ||
      isYouTubeUrlLike(asset.title) ||
      (asset.sourceUrl && sourceUrlsReferToSameYouTubeVideo(asset.title, asset.sourceUrl)));
  const nextTitle = shouldUpdateTitle ? candidateTitle : asset.title;
  const nextDuration = asset.durationSeconds ?? candidate.durationSeconds ?? null;
  const nextThumbnail = asset.thumbnailUrl ?? candidate.thumbnailUrl ?? null;
  const nextSourceUrl = candidate.sourceUrl ?? asset.sourceUrl;
  const hasMetadataDelta = JSON.stringify(asset.metadata ?? {}) !== JSON.stringify(mergedMetadata);

  const shouldUpdate =
    nextTitle !== asset.title ||
    nextDuration !== asset.durationSeconds ||
    nextThumbnail !== asset.thumbnailUrl ||
    nextSourceUrl !== asset.sourceUrl ||
    hasMetadataDelta;

  if (!shouldUpdate) {
    return;
  }

  summary.youtubeAssetsUpdated += 1;

  if (!execute) {
    return;
  }

  await dbClient
    .update(schema.asset)
    .set({
      title: nextTitle,
      durationSeconds: nextDuration,
      thumbnailUrl: nextThumbnail,
      sourceUrl: nextSourceUrl,
      metadata: mergedMetadata,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(schema.asset.id, assetId), eq(schema.asset.organizationId, organizationId)));
}

async function getExistingAssetById(
  dbClient: DbOrTxClient,
  candidate: NormalizedAssetCandidate,
  organizationId: string
) {
  if (!candidate.existingAssetId) {
    return null;
  }

  const existingById = await dbClient
    .select()
    .from(schema.asset)
    .where(and(eq(schema.asset.id, candidate.existingAssetId), eq(schema.asset.organizationId, organizationId)))
    .limit(1);

  if (existingById.length === 0) {
    return null;
  }

  const asset = existingById[0];

  if (candidate.provider === 'upload') {
    if (!candidate.storageKey || asset.provider !== 'upload') {
      return null;
    }

    return asset.storageKey === candidate.storageKey ? asset : null;
  }

  if (!candidate.sourceUrl) {
    return null;
  }

  if (candidate.provider === 'youtube' && asset.provider === 'youtube') {
    return sourceUrlsReferToSameYouTubeVideo(asset.sourceUrl, candidate.sourceUrl) ? asset : null;
  }

  return asset.provider === candidate.provider && asset.sourceUrl === candidate.sourceUrl ? asset : null;
}

async function getExistingAssetByNaturalKey(
  dbClient: DbOrTxClient,
  candidate: NormalizedAssetCandidate,
  organizationId: string
) {
  if (candidate.provider === 'upload') {
    if (!candidate.storageKey) {
      return null;
    }

    const existingByKey = await dbClient
      .select()
      .from(schema.asset)
      .where(
        and(
          eq(schema.asset.organizationId, organizationId),
          eq(schema.asset.provider, 'upload'),
          eq(schema.asset.storageKey, candidate.storageKey)
        )
      )
      .limit(1);

    return existingByKey[0] ?? null;
  }

  if (!candidate.sourceUrl) {
    return null;
  }

  if (candidate.provider === 'youtube') {
    const videoId = extractYouTubeVideoId(candidate.sourceUrl);
    if (!videoId) {
      return null;
    }

    const existingYouTubeAsset = await dbClient
      .select()
      .from(schema.asset)
      .where(
        and(
          eq(schema.asset.organizationId, organizationId),
          eq(schema.asset.provider, 'youtube'),
          eq(schema.asset.kind, candidate.kind),
          eq(schema.asset.isExternal, true),
          sql`${schema.asset.sourceUrl} is not null`,
          sql`${schema.asset.sourceUrl} like ${`%${videoId}%`}`
        )
      )
      .orderBy(desc(schema.asset.createdAt))
      .limit(1);

    return existingYouTubeAsset[0] ?? null;
  }

  const existingByLink = await dbClient
    .select()
    .from(schema.asset)
    .where(
      and(
        eq(schema.asset.organizationId, organizationId),
        eq(schema.asset.provider, candidate.provider),
        eq(schema.asset.sourceUrl, candidate.sourceUrl),
        eq(schema.asset.kind, candidate.kind),
        eq(schema.asset.isExternal, true)
      )
    )
    .orderBy(desc(schema.asset.createdAt))
    .limit(1);

  return existingByLink[0] ?? null;
}

async function resolveAssetForCandidate(
  dbClient: DbOrTxClient,
  params: {
    lessonId: string;
    organizationId: string;
    createdByProfileId: string | null;
    candidate: NormalizedAssetCandidate;
    execute: boolean;
  }
): Promise<ResolvedAssetResult> {
  const { lessonId, organizationId, createdByProfileId, candidate, execute } = params;

  const byId = await getExistingAssetById(dbClient, candidate, organizationId);
  if (byId) {
    return {
      id: byId.id,
      created: false,
      byteSize: byId.byteSize ?? null,
      synthetic: false
    };
  }

  const byNaturalKey = await getExistingAssetByNaturalKey(dbClient, candidate, organizationId);
  if (byNaturalKey) {
    return {
      id: byNaturalKey.id,
      created: false,
      byteSize: byNaturalKey.byteSize ?? null,
      synthetic: false
    };
  }

  if (!execute) {
    return {
      id: buildDryRunAssetId({
        lessonId,
        slotType: candidate.slotType,
        index: candidate.position
      }),
      created: true,
      byteSize: candidate.byteSize,
      synthetic: true
    };
  }

  const [createdAsset] = await dbClient
    .insert(schema.asset)
    .values({
      organizationId,
      kind: candidate.kind,
      provider: candidate.provider,
      storageProvider: candidate.storageProvider,
      storageKey: candidate.storageKey,
      sourceUrl: candidate.sourceUrl,
      mimeType: candidate.mimeType,
      byteSize: candidate.byteSize,
      title: candidate.title,
      description: candidate.description,
      thumbnailUrl: candidate.thumbnailUrl,
      durationSeconds: candidate.durationSeconds,
      aspectRatio: candidate.aspectRatio,
      isExternal: candidate.isExternal,
      status: 'active',
      metadata: candidate.metadata,
      createdByProfileId
    })
    .returning();

  if (!createdAsset) {
    throw new Error('Failed to create asset');
  }

  return {
    id: createdAsset.id,
    created: true,
    byteSize: createdAsset.byteSize ?? null,
    synthetic: false
  };
}

async function createOrPredictUsage(
  dbClient: DbOrTxClient,
  params: {
    execute: boolean;
    syntheticAssetId: boolean;
    organizationId: string;
    assetId: string;
    lessonId: string;
    slotType: SlotType;
    index: number;
    createdByProfileId: string | null;
  }
): Promise<{ created: boolean }> {
  if (params.syntheticAssetId) {
    return { created: true };
  }

  const existingUsage = await dbClient
    .select()
    .from(schema.assetUsage)
    .where(
      and(
        eq(schema.assetUsage.organizationId, params.organizationId),
        eq(schema.assetUsage.assetId, params.assetId),
        eq(schema.assetUsage.targetType, 'lesson'),
        eq(schema.assetUsage.targetId, params.lessonId),
        eq(schema.assetUsage.slotType, params.slotType),
        sql`${schema.assetUsage.slotKey} is null`,
        eq(schema.assetUsage.position, params.index)
      )
    )
    .limit(1);

  if (existingUsage.length > 0) {
    return { created: false };
  }

  if (!params.execute) {
    return { created: true };
  }

  await dbClient.insert(schema.assetUsage).values({
    organizationId: params.organizationId,
    assetId: params.assetId,
    targetType: 'lesson',
    targetId: params.lessonId,
    slotType: params.slotType,
    slotKey: null,
    position: params.index,
    createdByProfileId: params.createdByProfileId
  });

  return { created: true };
}

async function processCandidate(
  dbClient: DbOrTxClient,
  params: {
    execute: boolean;
    organizationId: string;
    lessonId: string;
    createdByProfileId: string | null;
    candidate: NormalizedAssetCandidate;
    currentAssetId: string | null;
  }
) {
  const assetResult = await resolveAssetForCandidate(dbClient, {
    lessonId: params.lessonId,
    organizationId: params.organizationId,
    createdByProfileId: params.createdByProfileId,
    candidate: params.candidate,
    execute: params.execute
  });

  if (assetResult.created) {
    summary.assetsCreated += 1;
  } else {
    summary.assetsReused += 1;
  }

  if (assetResult.byteSize != null) {
    summary.assetsWithByteSize += 1;
  } else {
    summary.assetsMissingByteSize += 1;
  }

  const usage = await createOrPredictUsage(dbClient, {
    execute: params.execute,
    syntheticAssetId: assetResult.synthetic,
    organizationId: params.organizationId,
    assetId: assetResult.id,
    lessonId: params.lessonId,
    slotType: params.candidate.slotType,
    index: params.candidate.position,
    createdByProfileId: params.createdByProfileId
  });

  if (usage.created) {
    summary.usagesCreated += 1;
  } else {
    summary.usagesReused += 1;
  }

  if (!assetResult.synthetic) {
    await maybeUpdateYouTubeAssetMetadata(dbClient, {
      execute: params.execute,
      organizationId: params.organizationId,
      assetId: assetResult.id,
      candidate: params.candidate
    });
  }

  const shouldPatch = params.currentAssetId !== assetResult.id;
  if (shouldPatch) {
    summary.lessonItemsPatchedWithAssetId += 1;
  }

  if (sampleRows.length < 25) {
    sampleRows.push({
      lessonId: params.lessonId,
      slotType: params.candidate.slotType,
      index: params.candidate.position,
      kind: params.candidate.kind,
      provider: params.candidate.provider,
      storageKey: params.candidate.storageKey,
      sourceUrl: params.candidate.sourceUrl,
      assetId: assetResult.id,
      patched: shouldPatch
    });
  }

  return {
    assetId: assetResult.id,
    shouldPatch
  };
}

async function processLesson(
  lessonRow: {
    id: string;
    teacherId: string | null;
    videos: typeof schema.lesson.$inferSelect.videos;
    documents: typeof schema.lesson.$inferSelect.documents;
    courseGroupId: string | null;
    organizationId: string | null;
  },
  execute: boolean
) {
  summary.lessonsScanned += 1;

  const organizationId = lessonRow.organizationId ?? fallbackOrganizationId;
  if (!organizationId) {
    summary.skippedMissingOrganization += 1;
    summary.errors += 1;
    const reason = lessonRow.courseGroupId ? 'group has no organization_id' : 'course.group_id is null';
    console.error(`Skipping lesson ${lessonRow.id}: missing organization linkage (${reason})`);
    return;
  }

  const rawVideos = Array.isArray(lessonRow.videos) ? lessonRow.videos : [];
  const rawDocuments = Array.isArray(lessonRow.documents) ? lessonRow.documents : [];
  const patchedVideos = rawVideos.map((video) => ({ ...video })) as Array<Record<string, unknown>>;
  const patchedDocuments = rawDocuments.map((document) => ({ ...document })) as Array<Record<string, unknown>>;

  let shouldPatchVideos = false;
  let shouldPatchDocuments = false;

  const increment = (key: MediaSummaryKey) => {
    summary[key] += 1;
  };

  const runWithClient = async (dbClient: DbOrTxClient) => {
    for (let index = 0; index < rawVideos.length; index += 1) {
      summary.mediaItemsScanned += 1;

      const rawVideo = rawVideos[index] as LessonVideo;
      if (!rawVideo || typeof rawVideo !== 'object') {
        increment('skippedMalformed');
        continue;
      }

      const currentAssetId = asString((patchedVideos[index] as LessonVideo).assetId);
      let candidate = normalizeVideoCandidate(rawVideo, index, increment);
      if (!candidate) {
        continue;
      }

      candidate = await enrichYouTubeCandidate(candidate);

      if (currentAssetId && candidate.provider !== 'youtube') {
        continue;
      }

      summary.mediaItemsEligible += 1;

      const result = await processCandidate(dbClient, {
        execute,
        organizationId,
        lessonId: lessonRow.id,
        createdByProfileId: lessonRow.teacherId,
        candidate,
        currentAssetId
      });

      if (result.shouldPatch) {
        patchedVideos[index].assetId = result.assetId;
        shouldPatchVideos = true;
      }

      if (candidate.provider === 'youtube') {
        const existingVideo = patchedVideos[index] as LessonVideo;
        const existingFileName = asString(existingVideo.fileName);
        const existingLink = asString(existingVideo.link);
        const resolvedTitle = candidate.title ?? null;
        const existingMetadata = normalizeMetadata(existingVideo.metadata);
        const resolvedVideoId = extractYouTubeVideoId(candidate.sourceUrl);
        const nextMetadata = {
          ...existingMetadata,
          ...(resolvedTitle ? { title: resolvedTitle } : {}),
          ...(candidate.durationSeconds != null ? { duration: candidate.durationSeconds } : {}),
          ...(candidate.thumbnailUrl ? { thumbnailUrl: candidate.thumbnailUrl } : {}),
          ...(resolvedVideoId ? { videoId: resolvedVideoId } : {})
        };

        if (resolvedTitle && (!existingFileName || isYouTubeUrlLike(existingFileName))) {
          patchedVideos[index].fileName = resolvedTitle;
          shouldPatchVideos = true;
        }

        if (candidate.sourceUrl && existingLink !== candidate.sourceUrl) {
          patchedVideos[index].link = candidate.sourceUrl;
          shouldPatchVideos = true;
        }

        if (JSON.stringify(existingMetadata) !== JSON.stringify(nextMetadata)) {
          patchedVideos[index].metadata = nextMetadata;
          shouldPatchVideos = true;
        }
      }
    }

    for (let index = 0; index < rawDocuments.length; index += 1) {
      summary.mediaItemsScanned += 1;

      const rawDocument = rawDocuments[index] as LessonDocument;
      if (!rawDocument || typeof rawDocument !== 'object') {
        increment('skippedMalformed');
        continue;
      }

      const currentAssetId = asString((patchedDocuments[index] as LessonDocument).assetId);
      if (currentAssetId) {
        continue;
      }

      const candidate = normalizeDocumentCandidate(rawDocument, index, increment);
      if (!candidate) {
        continue;
      }

      summary.mediaItemsEligible += 1;

      const result = await processCandidate(dbClient, {
        execute,
        organizationId,
        lessonId: lessonRow.id,
        createdByProfileId: lessonRow.teacherId,
        candidate,
        currentAssetId
      });

      if (result.shouldPatch) {
        patchedDocuments[index].assetId = result.assetId;
        shouldPatchDocuments = true;
      }
    }

    if (execute && (shouldPatchVideos || shouldPatchDocuments)) {
      await dbClient
        .update(schema.lesson)
        .set({
          ...(shouldPatchVideos ? { videos: patchedVideos as typeof schema.lesson.$inferSelect.videos } : {}),
          ...(shouldPatchDocuments
            ? { documents: patchedDocuments as typeof schema.lesson.$inferSelect.documents }
            : {}),
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.lesson.id, lessonRow.id));
    }
  };

  if (execute) {
    await db.transaction(async (tx) => {
      await runWithClient(tx);
    });
  } else {
    await runWithClient(db);
  }
}

async function backfillLessonAssets() {
  console.log(
    `[media-manager] Starting lesson assets backfill in ${isDryRun ? 'DRY-RUN' : 'EXECUTE'} mode (batch=${batchSize})`
  );
  if (fallbackOrganizationId) {
    console.log(`[media-manager] Fallback organization id enabled: ${fallbackOrganizationId}`);
  }

  let offset = 0;

  try {
    while (true) {
      const lessons = await db
        .select({
          id: schema.lesson.id,
          teacherId: schema.lesson.teacherId,
          videos: schema.lesson.videos,
          documents: schema.lesson.documents,
          courseGroupId: schema.course.groupId,
          organizationId: schema.group.organizationId
        })
        .from(schema.lesson)
        .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
        .leftJoin(schema.group, eq(schema.course.groupId, schema.group.id))
        .orderBy(asc(schema.lesson.id))
        .limit(batchSize)
        .offset(offset);

      if (lessons.length === 0) {
        break;
      }

      for (const lessonRow of lessons) {
        try {
          await processLesson(lessonRow, shouldExecute && !isDryRun);
        } catch (error) {
          summary.errors += 1;
          console.error(`Failed processing lesson ${lessonRow.id}:`, error);
        }
      }

      offset += lessons.length;
      console.log(
        `[media-manager] Progress: lessons=${summary.lessonsScanned} eligibleItems=${summary.mediaItemsEligible} assetsCreated=${summary.assetsCreated} usagesCreated=${summary.usagesCreated}`
      );
    }

    console.log('[media-manager] Backfill summary:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('[media-manager] Sample rows:');
    console.log(JSON.stringify(sampleRows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('[media-manager] Unhandled backfill failure:', error);
    process.exit(1);
  }
}

backfillLessonAssets();
