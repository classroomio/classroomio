export const COMMENT_PREVIEW_COUNT = 3;

const LONG_COMMENT_CHARACTERS = 420;
const LONG_COMMENT_LINES = 6;

/** True when a comment is long enough to collapse behind "Read more". */
export function isLongComment(text: string): boolean {
  return text.length > LONG_COMMENT_CHARACTERS || text.split('\n').length > LONG_COMMENT_LINES;
}
