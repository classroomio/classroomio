const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|api[_-]?key|cookie)/i;

/**
 * Masks bearer tokens and sensitive-looking JSON values so response bodies are safe to store and display.
 */
export function redactSensitiveText(text: string): string {
  return text
    .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]')
    .replace(/("([^"\\]*)"\s*:\s*)"((?:[^"\\]|\\.)*)"/g, (match, prefix: string, key: string) =>
      SENSITIVE_KEY_PATTERN.test(key) ? `${prefix}"[redacted]"` : match
    );
}

export function truncateText(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
