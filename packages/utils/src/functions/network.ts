/**
 * Checks whether a given host or hostname represents a local machine
 * or a private local area network (LAN) IP address.
 *
 * Covered addresses:
 * - Loopback: localhost, 127.0.0.0/8, ::1, [::1], 0.0.0.0
 * - mDNS: *.local
 * - Private IPv4 (RFC 1918):
 *   - 10.0.0.0/8
 *   - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 *   - 192.168.0.0/16
 * - Link-local IPv4 (RFC 3927): 169.254.0.0/16
 */
export function isLocalOrPrivateHost(input: string): boolean {
  if (!input) return false;

  let host = input.trim().toLowerCase();

  // Strip brackets from IPv6, e.g. [::1]:5173 or [::1]
  if (host.startsWith('[')) {
    const closeBracket = host.indexOf(']');
    if (closeBracket !== -1) {
      host = host.slice(1, closeBracket);
    }
  } else if (host.includes(':')) {
    // If it's standard host:port (exactly one colon, e.g. localhost:5173 or 192.168.1.1:3000)
    const colonCount = (host.match(/:/g) || []).length;
    if (colonCount === 1) {
      host = host.split(':')[0]!;
    }
    // If multiple colons, it's an unbracketed IPv6 address like ::1
  }

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' || host.endsWith('.local')) {
    return true;
  }

  // IPv4 address classification with octet validation (0-255)
  const ipv4Parts = host.split('.');
  if (ipv4Parts.length === 4) {
    const octets: number[] = [];
    for (const part of ipv4Parts) {
      if (!/^\d{1,3}$/.test(part)) return false;
      const num = Number(part);
      if (num < 0 || num > 255) return false;
      octets.push(num);
    }

    const [first, second] = octets as [number, number, number, number];

    // IPv4 loopback (127.0.0.0/8)
    if (first === 127) return true;

    // IPv4 private ranges (RFC 1918)
    // 10.0.0.0/8
    if (first === 10) return true;
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (first === 172 && second >= 16 && second <= 31) return true;
    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;

    // IPv4 link-local (RFC 3927: 169.254.0.0/16)
    if (first === 169 && second === 254) return true;
  }

  return false;
}
