import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';

import { AppError } from '@cio/utils/errors';
import { ErrorCodes } from '@cio/utils/constants/error-codes';

const MAX_REDIRECTS = 3;
const MAX_HEAD_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8_000;

const PRIVATE_IPV4_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xe0000000, 4],
  [0xf0000000, 4]
];

function ipv4ToNumber(address: string): number {
  return address.split('.').reduce((total, part) => total * 256 + Number(part), 0);
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToNumber(address);

  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const mask = (0xffffffff << (32 - bits)) >>> 0;

    return (value & mask) >>> 0 === (base & mask) >>> 0;
  });
}

function expandIpv6(address: string): number[] | null {
  let text = address.toLowerCase().split('%')[0];
  const dotted = text.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const value = ipv4ToNumber(dotted[1]);
    text = `${text.slice(0, -dotted[1].length)}${(value >>> 16).toString(16)}:${(value & 0xffff).toString(16)}`;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null;

  const groups = [...head, ...Array<string>(missing).fill('0'), ...tail].map((group) => parseInt(group, 16));

  return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff)
    ? groups
    : null;
}

function embeddedIpv4(high: number, low: number): string {
  return [high >>> 8, high & 0xff, low >>> 8, low & 0xff].join('.');
}

function isPrivateIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return true;

  const [first, second] = groups;
  const leadingZeros = groups.slice(0, 5).every((group) => group === 0);

  if (leadingZeros && groups[5] === 0xffff) return isPrivateIpv4(embeddedIpv4(groups[6], groups[7]));
  if (leadingZeros && groups[5] === 0) return true;
  if (first === 0x64 && second === 0xff9b) return isPrivateIpv4(embeddedIpv4(groups[6], groups[7]));
  if (first === 0x2002) return isPrivateIpv4(embeddedIpv4(groups[1], groups[2]));
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80 || (first & 0xffc0) === 0xfec0) return true;
  if ((first & 0xff00) === 0xff00) return true;

  return false;
}

/**
 * True for loopback, private, link-local, site-local, unique-local, multicast and reserved addresses, including IPv6
 * forms that embed an IPv4 address (mapped, compatible, NAT64 and 6to4). Anything that is not an IP address counts as
 * private, so a failed parse never opens a hole.
 */
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);

  return true;
}

function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (error: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, '', 4);

    const blocked = addresses.some((entry) => isPrivateAddress(entry.address));
    if (blocked || addresses.length === 0) {
      return callback(new Error('Address is not allowed') as NodeJS.ErrnoException, '', 4);
    }

    if (options.all) return callback(null, addresses);

    return callback(null, addresses[0].address, addresses[0].family);
  });
}

function assertPublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError('Invalid website URL', ErrorCodes.WEBSITE_UNREADABLE, 400);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError('Website URL must use http or https', ErrorCodes.WEBSITE_UNREADABLE, 400);
  }

  const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (parsed.username || parsed.password || isIP(bareHost) !== 0) {
    throw new AppError('Website URL is not allowed', ErrorCodes.WEBSITE_UNREADABLE, 400);
  }

  return parsed;
}

type HeadResponse = { status: number; location: string | null; contentType: string; html: string };

function requestHead(url: URL): Promise<HeadResponse> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;

    const request = transport.request(
      url,
      {
        method: 'GET',
        lookup: guardedLookup as never,
        timeout: FETCH_TIMEOUT_MS,
        headers: { accept: 'text/html', 'user-agent': 'ClassroomIO-Onboarding/1.0' }
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = typeof response.headers.location === 'string' ? response.headers.location : null;
        const contentType = String(response.headers['content-type'] ?? '');

        if (status >= 300 && status < 400) {
          response.resume();

          return resolve({ status, location, contentType, html: '' });
        }

        const decoder = new TextDecoder();
        let html = '';
        let bytes = 0;

        response.on('data', (chunk: Buffer) => {
          bytes += chunk.byteLength;
          html += decoder.decode(chunk, { stream: true });

          if (bytes >= MAX_HEAD_BYTES || /<\/head\s*>/i.test(html)) {
            response.destroy();
            resolve({ status, location, contentType, html });
          }
        });
        response.on('end', () => resolve({ status, location, contentType, html }));
        response.on('error', () => resolve({ status, location, contentType, html }));
      }
    );

    const deadline = setTimeout(() => request.destroy(new Error('Request timed out')), FETCH_TIMEOUT_MS);
    request.on('close', () => clearTimeout(deadline));
    request.on('timeout', () => request.destroy(new Error('Request timed out')));
    request.on('error', reject);
    request.end();
  });
}

/**
 * Fetches the start of a public web page's HTML. Every connection, including each redirect hop, is checked against
 * private address ranges at connect time. Follows at most 3 redirects, reads at most 512 KB and gives up after 8 s.
 */
export async function fetchPublicHtmlHead(rawUrl: string): Promise<{ finalUrl: string; html: string }> {
  let current = assertPublicHttpUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let result: HeadResponse;

    try {
      result = await requestHead(current);
    } catch {
      throw new AppError('Website could not be read', ErrorCodes.WEBSITE_UNREADABLE, 502);
    }

    if (result.status >= 300 && result.status < 400) {
      if (!result.location) break;

      current = assertPublicHttpUrl(new URL(result.location, current).href);
      continue;
    }

    if (result.status < 200 || result.status >= 300) {
      throw new AppError('Website could not be read', ErrorCodes.WEBSITE_UNREADABLE, 502);
    }

    if (!result.contentType.toLowerCase().includes('text/html')) {
      throw new AppError('Website did not return a page', ErrorCodes.WEBSITE_UNREADABLE, 502);
    }

    return { finalUrl: current.href, html: result.html };
  }

  throw new AppError('Website redirected too many times', ErrorCodes.WEBSITE_UNREADABLE, 502);
}
