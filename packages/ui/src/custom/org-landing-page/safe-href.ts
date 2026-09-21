import { isAllowedHref } from '@cio/utils/validation/shared';

export function safeHref(value: unknown, fallback = '#'): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  if (!isAllowedHref(trimmed)) {
    return fallback;
  }

  return trimmed;
}
