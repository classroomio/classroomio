import { parseHelpArticleIndex, type HelpArticleIndex } from './agent-resources';
import { HELP_ORIGIN } from './upstreams';

const HELP_INDEX_TIMEOUT_MS = 8000;

/** Loads titles and descriptions from the help center's own llms.txt. Returns an empty index if it is unreachable. */
export async function loadHelpArticleIndex(): Promise<HelpArticleIndex> {
  try {
    const response = await fetch(new URL('/help/llms.txt', HELP_ORIGIN), {
      signal: AbortSignal.timeout(HELP_INDEX_TIMEOUT_MS)
    });
    if (!response.ok) return new Map();

    return parseHelpArticleIndex(await response.text());
  } catch (error) {
    console.error('loadHelpArticleIndex error:', error);

    return new Map();
  }
}
