import type { Writable } from 'svelte/store';
import type { Tag } from './types.js';
export declare function focusInput(id: string, pos?: 'default' | 'start' | 'end'): void;
export declare function setSelectedFromEl(el: Element | null, selected: Writable<Tag | null>): void;
export declare function highlightText(query: string): void;
