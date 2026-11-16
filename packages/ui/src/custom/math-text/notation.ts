import { writable } from 'svelte/store';
import { DEFAULT_MATH_NOTATION, type MathNotationSettings } from '@cio/question-types';

/** The notation in force for the page: set by the app once the organisation and course are known; read by `MathText` and `MathInput`. */
export const mathNotation = writable<MathNotationSettings>(DEFAULT_MATH_NOTATION);
