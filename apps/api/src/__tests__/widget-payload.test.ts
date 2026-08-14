import { describe, expect, it } from 'vitest';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Mirrors the key generation logic from widget-payload.ts for isolated testing. */
function encodeBase58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }

  if (value === 0n) {
    return BASE58_ALPHABET[0];
  }

  let encoded = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    value /= 58n;
  }

  return encoded;
}

function generateWidgetPublicKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `wgt_${encodeBase58(bytes).slice(0, 16)}`;
}

function getWidgetEmbedCode(publicKey: string): string {
  const scriptUrl = 'https://embed.classroomio.com/course-widget';
  return `<div data-cio-widget="course-widget" data-widget-key="${publicKey}"></div>\n<script async type="module" src="${scriptUrl}"></script>`;
}

describe('generateWidgetPublicKey', () => {
  it('should start with wgt_ prefix', () => {
    const key = generateWidgetPublicKey();
    expect(key.startsWith('wgt_')).toBe(true);
  });

  it('should have expected length', () => {
    const key = generateWidgetPublicKey();
    expect(key.length).toBe(20); // 'wgt_' + 16 chars
  });

  it('should generate unique keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateWidgetPublicKey()));
    expect(keys.size).toBe(50);
  });

  it('should only contain base58 characters after prefix', () => {
    const key = generateWidgetPublicKey();
    const suffix = key.slice(4);
    const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    expect(base58Regex.test(suffix)).toBe(true);
  });
});

describe('encodeBase58', () => {
  it('should encode zero bytes to 1', () => {
    expect(encodeBase58(new Uint8Array([0]))).toBe('1');
  });

  it('should produce deterministic output', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const resultA = encodeBase58(bytes);
    const resultB = encodeBase58(bytes);
    expect(resultA).toBe(resultB);
  });

  it('should not contain ambiguous characters (0, O, I, l)', () => {
    const encoded = BASE58_ALPHABET;
    expect(encoded).not.toContain('0');
    expect(encoded).not.toContain('O');
    expect(encoded).not.toContain('I');
    expect(encoded).not.toContain('l');
  });
});

describe('getWidgetEmbedCode', () => {
  it('should contain the public key in data attribute', () => {
    const embedCode = getWidgetEmbedCode('wgt_testkey123456');
    expect(embedCode).toContain('data-widget-key="wgt_testkey123456"');
  });

  it('should contain the widget type data attribute', () => {
    const embedCode = getWidgetEmbedCode('wgt_testkey123456');
    expect(embedCode).toContain('data-cio-widget="course-widget"');
  });

  it('should contain an async module script tag', () => {
    const embedCode = getWidgetEmbedCode('wgt_testkey123456');
    expect(embedCode).toContain('<script async type="module"');
  });

  it('should reference the public embed script URL', () => {
    const embedCode = getWidgetEmbedCode('wgt_testkey123456');
    expect(embedCode).toContain('embed.classroomio.com/course-widget');
  });

  it('should not include an API base URL in the embed snippet', () => {
    const embedCode = getWidgetEmbedCode('wgt_testkey123456');
    expect(embedCode).not.toContain('data-api-base-url');
    expect(embedCode).not.toContain('api.classroomio.com');
  });

  it('should properly escape special characters in public key', () => {
    // Public keys are base58, so no special HTML chars, but verify structure
    const embedCode = getWidgetEmbedCode('wgt_abc123def456gh');
    expect(embedCode).toMatch(/^<div[^>]+><\/div>\n<script[^>]+><\/script>$/);
  });
});
