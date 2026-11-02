const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(bytes: Uint8Array) {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);

    output += ALPHABET[(triple >> 18) & 63];
    output += ALPHABET[(triple >> 12) & 63];
    output += b === undefined ? '=' : ALPHABET[(triple >> 6) & 63];
    output += c === undefined ? '=' : ALPHABET[triple & 63];
  }

  return output;
}
