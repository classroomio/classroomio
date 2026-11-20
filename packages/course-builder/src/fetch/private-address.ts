import { isIP } from 'node:net';

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
