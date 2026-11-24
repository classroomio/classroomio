import type { SourcePage } from '../sources/types';
import type { ExclusionReason } from './types';

const OBSOLETE_LABEL =
  /\b(obsolete|deprecated|legacy|archived|retired|sunset|old version|no longer (?:supported|available))\b/i;
const OBSOLETE_TITLE = [
  /^(?:obsolete|deprecated|legacy|archived|retired)\s*[:\-–—]/i,
  /[([](?:obsolete|deprecated|legacy|archived|retired|sunset|old|old version)[)\]]/i,
  /\bno longer (?:supported|available)\b/i
];
const PLACEHOLDER_TITLE = [
  /^(?:untitled|placeholder|lorem ipsum)\b/i,
  /^copy of\b/i,
  /^\[(?:draft|wip|test)\]/i,
  /^(?:test|draft)(?:\s+(?:page|article|doc|document))?(?:\s*\d+)?$/i
];
const RELEASE = /\b(?:release notes?|changelog|change log|what'?s new|product updates?)\b/i;
/** A title that is a release or version number: "Release 7.3", "Acme Release 12.1.1", "Version 2.4". */
const RELEASE_TITLE = /(?:^|\s)(?:release|version)\s+v?\d+(?:\.\d+)+$/i;
/** A section that holds releases: "Releases", "Release content", "Release history". */
const RELEASE_SECTION = /^releases?(?:\s+(?:content|history|information|notes?|updates?))?$/i;
const LEGAL_OR_COMPANY_TITLE =
  /^(?:privacy (?:policy|notice|statement)|cookie (?:policy|notice)|terms (?:of (?:service|use)|and conditions|& conditions)|legal notice|imprint|impressum|careers?|jobs at .+|press releases?|newsroom|investors?(?: relations)?|about us|gdpr (?:policy|statement))$/i;
const LEGAL_OR_COMPANY_SEGMENTS = new Set([
  'privacy-policy',
  'privacy-notice',
  'terms-of-service',
  'terms-of-use',
  'terms-and-conditions',
  'cookie-policy',
  'cookies-policy',
  'legal',
  'imprint',
  'impressum',
  'careers',
  'newsroom',
  'press-releases',
  'investors',
  'investor-relations',
  'blog'
]);
const COMMUNITY_SEGMENTS = new Set(['community', 'forum', 'forums', 'discussions']);
const RELEASE_SEGMENTS = ['release-notes', 'release-note', 'changelog', 'whats-new'];

/** URL path segments whose pages are never taught, whatever their title: a reader with a small page budget skips them. */
export const EXCLUDED_PATH_SEGMENTS: readonly string[] = [
  ...LEGAL_OR_COMPANY_SEGMENTS,
  ...COMMUNITY_SEGMENTS,
  ...RELEASE_SEGMENTS
];

function pathSegments(url: string): string[] {
  try {
    return new URL(url).pathname.toLowerCase().split('/').filter(Boolean);
  } catch {
    return [];
  }
}

/** The page's own title without a trailing site name: "Privacy policy | Acme" → "Privacy policy". */
function ownTitle(title: string): string {
  return title.split(/\s+[|–—]\s+|\s+-\s+/)[0].trim();
}

/**
 * Why a page must not be taught, judged from its title, path and the labels the site itself shows. Matches exact
 * phrases and whole URL segments, never single words: "Scheduling jobs", "Payment terms" and "Comments on a work
 * order" are product features on many sites.
 */
export function exclusionFor(page: Pick<SourcePage, 'url' | 'title' | 'path' | 'labels'>): ExclusionReason | null {
  const title = ownTitle(page.title);
  const segments = pathSegments(page.url);

  if (page.labels.some((label) => OBSOLETE_LABEL.test(label))) return 'obsolete';
  if (OBSOLETE_TITLE.some((pattern) => pattern.test(title))) return 'obsolete';
  if (PLACEHOLDER_TITLE.some((pattern) => pattern.test(title))) return 'placeholder';
  if ([title, ...page.path, ...page.labels].some((text) => RELEASE.test(text))) return 'release-notes';
  if (RELEASE_TITLE.test(title) || page.path.some((section) => RELEASE_SECTION.test(section.trim()))) {
    return 'release-notes';
  }
  if (segments.some((segment) => RELEASE_SEGMENTS.includes(segment))) return 'release-notes';
  if (LEGAL_OR_COMPANY_TITLE.test(title) || segments.some((segment) => LEGAL_OR_COMPANY_SEGMENTS.has(segment))) {
    return 'legal-or-company';
  }
  if (segments.some((segment) => COMMUNITY_SEGMENTS.has(segment))) return 'community';

  return null;
}

/** Release notes are kept to tell which name or behaviour is current, but never become lessons. */
export function isReferenceOnly(reason: ExclusionReason | null): boolean {
  return reason === 'release-notes';
}
