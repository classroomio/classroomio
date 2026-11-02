import { CHECK_IN_CODE_ALPHABET, CHECK_IN_CODE_LENGTH } from '@cio/utils/constants/attendance';

export type CheckInTarget = { lessonId: string; code: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Uppercases typed input and drops anything that cannot appear in a check-in code, up to the code length. */
export function normalizeCheckInCode(value: string) {
  return value
    .toUpperCase()
    .split('')
    .filter((character) => CHECK_IN_CODE_ALPHABET.includes(character))
    .join('')
    .slice(0, CHECK_IN_CODE_LENGTH);
}

export function isCompleteCheckInCode(code: string) {
  return normalizeCheckInCode(code).length === CHECK_IN_CODE_LENGTH;
}

/** Splits a code into two halves for reading aloud or off a screen: "K7M4QX" → "K7M 4QX". */
export function groupCheckInCode(code: string) {
  const half = Math.ceil(code.length / 2);

  return `${code.slice(0, half)} ${code.slice(half)}`;
}

function queryParams(url: string) {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const params: Record<string, string> = {};
  for (const pair of query.split('&')) {
    const [key, value = ''] = pair.split('=');
    if (!key) continue;

    try {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      params[key] = value;
    }
  }

  return params;
}

/**
 * Reads the lesson and code from a check-in QR payload (`classroomio://check-in?lesson=<id>&code=<code>`).
 * Returns null for anything else.
 */
export function parseCheckInPayload(data: string): CheckInTarget | null {
  const trimmed = data.trim();
  const path = trimmed.split('?')[0] ?? '';
  if (!/(^|[/:])check-in\/?$/.test(path)) return null;

  return checkInTargetOf(queryParams(trimmed));
}

/** A valid check-in target from route or query params, or null when the lesson or code is missing or malformed. */
export function checkInTargetOf(params: {
  lesson?: string | string[];
  code?: string | string[];
}): CheckInTarget | null {
  const lessonId = Array.isArray(params.lesson) ? params.lesson[0] : params.lesson;
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  if (!lessonId || !rawCode || !UUID_PATTERN.test(lessonId)) return null;

  const code = normalizeCheckInCode(rawCode);
  if (code.length !== CHECK_IN_CODE_LENGTH) return null;

  return { lessonId, code };
}
