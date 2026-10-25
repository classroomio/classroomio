import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import type { PersonalLearningSource } from '@cio/db/schema';
import { redis } from '@cio/core/utils/redis/redis';
import { AppError } from '@cio/utils/errors';

import { validateSourceUrl } from './source-validation';

const JINA_SEARCH_URL = 'https://s.jina.ai/';
const JINA_READER_URL = 'https://r.jina.ai/';
const SOURCE_TIMEOUT_MS = 8_000;
const MAX_SOURCE_COUNT = 3;
const MAX_SOURCE_CONTENT_LENGTH = 12_000;
const MAX_DAILY_SEARCH_REQUESTS = 5;
const MAX_DAILY_FETCH_REQUESTS = 15;
const SOURCE_QUOTA_TTL_SECONDS = 25 * 60 * 60;

type SearchResult = { url: string; title: string };

function isPrivateAddress(address: string): boolean {
  const normalizedAddress = address.toLowerCase().split('%')[0];
  const ipv4Address = normalizedAddress.startsWith('::ffff:')
    ? normalizedAddress.slice('::ffff:'.length)
    : normalizedAddress;
  const addressFamily = isIP(normalizedAddress);

  if (addressFamily === 4 || (addressFamily === 6 && isIP(ipv4Address) === 4)) {
    const [first, second, third] = ipv4Address.split('.').map(Number);

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168 || (second === 0 && third === 2))) ||
      (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
      (first === 203 && second === 0 && third === 113)
    );
  }

  return (
    addressFamily !== 6 ||
    normalizedAddress === '::' ||
    normalizedAddress === '::1' ||
    normalizedAddress.startsWith('fc') ||
    normalizedAddress.startsWith('fd') ||
    /^fe[89ab]/.test(normalizedAddress) ||
    normalizedAddress.startsWith('ff') ||
    normalizedAddress.startsWith('2001:db8:')
  );
}

async function assertPublicSourceHost(sourceUrl: URL): Promise<void> {
  let resolvedAddresses: { address: string; family: number }[];

  try {
    resolvedAddresses = (await lookup(sourceUrl.hostname, { all: true, verbatim: true })) as {
      address: string;
      family: number;
    }[];
  } catch {
    throw new AppError('Learning source host could not be resolved', 'UNSAFE_SOURCE_HOST', 400);
  }

  if (resolvedAddresses.length === 0 || resolvedAddresses.some(({ address }) => isPrivateAddress(address))) {
    throw new AppError('Learning source resolves to a private or reserved address', 'UNSAFE_SOURCE_HOST', 400);
  }
}

async function reserveSourceQuota(ownerUserId: string, quota: 'search' | 'fetch'): Promise<void> {
  if (!redis.isReady) throw new AppError('Learning source quota is unavailable', 'SOURCE_QUOTA_UNAVAILABLE', 503);

  const utcDay = new Date().toISOString().slice(0, 10);
  const quotaKey = `personal-learning:${quota}-quota:${ownerUserId}:${utcDay}`;
  const dailyLimit = quota === 'search' ? MAX_DAILY_SEARCH_REQUESTS : MAX_DAILY_FETCH_REQUESTS;

  try {
    const requestCount = await redis.incr(quotaKey);
    if (requestCount === 1) await redis.expire(quotaKey, SOURCE_QUOTA_TTL_SECONDS);
    if (requestCount > dailyLimit) {
      throw new AppError('Daily learning source quota exceeded', 'LEARNING_SOURCE_QUOTA_EXCEEDED', 429);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError('Learning source quota is unavailable', 'SOURCE_QUOTA_UNAVAILABLE', 503);
  }
}

function isTimeoutError(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && 'name' in error && ['AbortError', 'TimeoutError'].includes(String(error.name))
  );
}

async function fetchJinaJson(
  url: string,
  init: RequestInit,
  failureCode: string,
  statusMismatchCode?: string
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS)
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new AppError('Learning source request timed out', 'LEARNING_SOURCE_TIMEOUT', 504);

    throw new AppError('Learning source request failed', failureCode, 502);
  }

  if (response.redirected || (response.status >= 300 && response.status < 400)) {
    throw new AppError('Learning source service returned an unsafe redirect', 'UNSAFE_SOURCE_REDIRECT', 502);
  }

  if (response.status === 429)
    throw new AppError('Learning source provider quota exceeded', 'LEARNING_SOURCE_QUOTA_EXCEEDED', 429);
  if (response.status === 422 && statusMismatchCode) {
    throw new AppError('Learning source page did not return HTTP 200', statusMismatchCode, 422);
  }
  if (!response.ok) throw new AppError('Learning source provider request failed', failureCode, 502);

  try {
    return await response.json();
  } catch {
    throw new AppError('Learning source provider returned invalid data', failureCode, 502);
  }
}

function readSearchResults(payload: unknown): SearchResult[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) return [];

  return payload.data.flatMap((value): SearchResult[] => {
    if (!value || typeof value !== 'object' || !('url' in value) || typeof value.url !== 'string') return [];

    return [
      {
        url: value.url,
        title: 'title' in value && typeof value.title === 'string' ? value.title.trim().slice(0, 200) : ''
      }
    ];
  });
}

function isOfficialSource(hostname: string): boolean {
  const host = hostname.toLowerCase();

  return (
    host.endsWith('.gov') ||
    host.includes('.gov.') ||
    host.endsWith('.edu') ||
    host.includes('.edu.') ||
    host.includes('.ac.')
  );
}

function sourceTitleFromContent(content: string, sourceUrl: URL): string {
  const firstHeading = content
    .split('\n')
    .find((line) => line.trim().startsWith('#'))
    ?.replace(/^#+\s*/, '')
    .trim();

  return firstHeading?.slice(0, 200) || sourceUrl.hostname;
}

function isNotFoundPage(title: string, content: string): boolean {
  const firstHeading = content
    .split('\n')
    .find((line) => line.trim().startsWith('#'))
    ?.replace(/^#+\s*/, '')
    .trim();
  const notFoundTitle = /^(?:404\s+not\s+found|page\s+not\s+found|not\s+found|error\s+404)(?:\s*[|:–-].*)?$/i;

  return [title, firstHeading ?? ''].some((candidate) => notFoundTitle.test(candidate.trim()));
}

export async function discoverLearningSources(input: {
  ownerUserId: string;
  query: string;
  language: string;
  userUrls?: string[];
}): Promise<PersonalLearningSource[]> {
  const userSourceUrls = (input.userUrls ?? []).map((url) => validateSourceUrl(url));
  for (const sourceUrl of userSourceUrls) await assertPublicSourceHost(sourceUrl);

  const jinaApiKey = process.env.JINA_API_KEY;
  if (!jinaApiKey && userSourceUrls.length === 0) {
    throw new AppError('A verified source is required when web search is not configured', 'NO_VERIFIABLE_SOURCE', 422);
  }

  let searchResults: SearchResult[] = [];
  const shouldSearch = Boolean(jinaApiKey && userSourceUrls.length === 0);

  if (shouldSearch && jinaApiKey) {
    await reserveSourceQuota(input.ownerUserId, 'search');
    const searchUrl = new URL(encodeURIComponent(input.query.slice(0, 1000)), JINA_SEARCH_URL);
    searchUrl.searchParams.set('num', '6');
    searchUrl.searchParams.set('hl', input.language.slice(0, 2));

    const searchPayload = await fetchJinaJson(
      searchUrl.href,
      { headers: { Authorization: `Bearer ${jinaApiKey}`, Accept: 'application/json' } },
      'LEARNING_SOURCE_SEARCH_FAILED'
    );
    searchResults = readSearchResults(searchPayload);
  }

  const candidates = [...userSourceUrls.map((sourceUrl) => ({ url: sourceUrl.href, title: '' })), ...searchResults]
    .flatMap((source, index) => {
      try {
        const sourceUrl = validateSourceUrl(source.url);
        return [{ url: sourceUrl, title: source.title, index }];
      } catch {
        return [];
      }
    })
    .filter((source, index, allSources) => allSources.findIndex(({ url }) => url.href === source.url.href) === index)
    .sort(
      (first, second) =>
        Number(isOfficialSource(second.url.hostname)) - Number(isOfficialSource(first.url.hostname)) ||
        first.index - second.index
    )
    .slice(0, MAX_SOURCE_COUNT);

  const sourceManifest: PersonalLearningSource[] = [];

  for (const candidate of candidates) {
    await assertPublicSourceHost(candidate.url);
    await reserveSourceQuota(input.ownerUserId, 'fetch');

    let readerPayload: unknown;

    try {
      readerPayload = await fetchJinaJson(
        JINA_READER_URL,
        {
          method: 'POST',
          headers: {
            ...(jinaApiKey ? { Authorization: `Bearer ${jinaApiKey}` } : {}),
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Max-Tokens': '4000',
            'X-Assert-Status-Code': '200'
          },
          body: JSON.stringify({ url: candidate.url.href })
        },
        'LEARNING_SOURCE_FETCH_FAILED',
        'SOURCE_URL_UNAVAILABLE'
      );
    } catch (error) {
      if (error instanceof AppError && error.code === 'SOURCE_URL_UNAVAILABLE') continue;

      throw error;
    }
    const readerData =
      readerPayload && typeof readerPayload === 'object' && 'data' in readerPayload && readerPayload.data
        ? readerPayload.data
        : null;
    const content =
      readerData && typeof readerData === 'object' && 'content' in readerData && typeof readerData.content === 'string'
        ? readerData.content.trim().slice(0, MAX_SOURCE_CONTENT_LENGTH)
        : '';
    const reportedUrl =
      readerData && typeof readerData === 'object' && 'url' in readerData && typeof readerData.url === 'string'
        ? readerData.url
        : candidate.url.href;

    let verifiedUrl: URL;

    try {
      verifiedUrl = validateSourceUrl(reportedUrl);
      await assertPublicSourceHost(verifiedUrl);
    } catch (error) {
      if (error instanceof AppError && ['INVALID_SOURCE_URL', 'UNSAFE_SOURCE_HOST'].includes(error.code)) continue;

      throw error;
    }

    const readerTitle =
      readerData && typeof readerData === 'object' && 'title' in readerData && typeof readerData.title === 'string'
        ? readerData.title.trim()
        : '';
    if (!content || isNotFoundPage(readerTitle, content)) continue;

    sourceManifest.push({
      url: verifiedUrl.href,
      title:
        readerTitle ||
        (verifiedUrl.href === candidate.url.href ? candidate.title : '') ||
        sourceTitleFromContent(content, verifiedUrl),
      accessedAt: new Date().toISOString(),
      content
    });
  }

  if (sourceManifest.length === 0)
    throw new AppError('No verifiable learning sources found', 'NO_VERIFIABLE_SOURCE', 422);

  return sourceManifest;
}
