import { writable } from 'svelte/store';
import type { TBlockType } from '@cio/utils/validation/block';

/**
 * A block, or the Ask AI prompt, that a teacher picked from an empty lesson in Preview.
 * The block editor opens it once the lesson switches to Edit.
 */
export const pendingBlockAdd = writable<TBlockType | 'ai' | null>(null);
