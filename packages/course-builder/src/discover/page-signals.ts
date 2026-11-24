import * as cheerio from 'cheerio';
import type { FetchResponse } from '../fetch/types';

const META_REFRESH = /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']\s*\d+\s*;\s*url\s*=\s*['"]?([^"'>\s]+)/i;
const META_REFRESH_REVERSED =
  /<meta[^>]+content=["']\s*\d+\s*;\s*url\s*=\s*['"]?([^"'>\s]+)[^>]*http-equiv=["']?refresh/i;
const SCRIPT_REDIRECT =
  /(?:window\.)?location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']|location\.replace\(\s*["'](https?:\/\/[^"']+)["']/i;
const SHORT_PAGE_BYTES = 4096;

/**
 * The target of a client-side redirect on a page: a meta refresh, or on very short pages a script that sets
 * `location`. Returns an absolute URL or null.
 */
export function clientRedirectTarget(response: FetchResponse): string | null {
  const head = response.body.slice(0, 64 * 1024);
  const meta = head.match(META_REFRESH) ?? head.match(META_REFRESH_REVERSED);
  const script = response.body.length <= SHORT_PAGE_BYTES ? response.body.match(SCRIPT_REDIRECT) : null;
  const target = meta?.[1] ?? script?.[1] ?? script?.[2];
  if (!target) return null;

  try {
    return new URL(target.replace(/&amp;/g, '&'), response.url).href;
  } catch {
    return null;
  }
}

const CHALLENGE_PHRASES =
  /just a moment|checking your browser|verify(?:ing)? (?:that )?you are (?:a )?human|are you a robot|enable javascript and cookies|captcha|access denied|request blocked|unusual traffic/i;
const CHALLENGE_MAX_TEXT = 2000;

/**
 * Whether an answer is an anti-bot interstitial rather than content: a refusal status, little visible text and the
 * wording such pages use.
 */
export function isBotChallenge(response: FetchResponse): boolean {
  if (response.status !== 403 && response.status !== 503 && response.status !== 429) return false;
  if (visibleTextLength(response.body) > CHALLENGE_MAX_TEXT) return false;

  return CHALLENGE_PHRASES.test(response.body.slice(0, 64 * 1024));
}

/** Whether a URL is a sign-in page, judged by a whole path segment. */
export function isLoginUrl(url: string): boolean {
  try {
    return /(^|\/)(log[-_]?in|sign[-_]?in|sign[-_]?up|sso|auth)(\/|$)/.test(new URL(url).pathname.toLowerCase());
  } catch {
    return false;
  }
}

export function isLoginWall(response: FetchResponse): boolean {
  if (response.status === 401) return true;
  if (isLoginUrl(response.url)) return true;

  const hasPasswordField = /<input[^>]+type=["']?password/i.test(response.body);

  return hasPasswordField && visibleTextLength(response.body) < 1500;
}

export function isParkedDomain(response: FetchResponse): boolean {
  return /this domain (?:is|may be) for sale|domain parking|parkingcrew|sedoparking|buy this domain/i.test(
    response.body.slice(0, 64 * 1024)
  );
}

export function pageTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, ' ').trim();

  return title ? decodeEntities(title) : null;
}

export function visibleTextLength(html: string): number {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** Decodes every HTML entity, named or numeric, the way a browser shows the text. */
function decodeEntities(text: string): string {
  return cheerio.load(text, null, false).text();
}
