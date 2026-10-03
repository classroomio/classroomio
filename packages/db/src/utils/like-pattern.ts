/**
 * LIKE/ILIKE `%…%` pattern for a user-typed search with `\`, `%` and `_`
 * escaped, so "50%" or "a_b" match literally instead of as wildcards.
 */
export function toContainsPattern(search: string): string {
  const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);

  return `%${escaped}%`;
}
