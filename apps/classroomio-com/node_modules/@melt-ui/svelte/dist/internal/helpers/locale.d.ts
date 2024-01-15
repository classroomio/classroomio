import type { TextDirection } from '../types.js';
/**
 * Detects the text direction in the element.
 * @returns {TextDirection} The text direction ('ltr' for left-to-right or 'rtl' for right-to-left).
 */
export declare function getElemDirection(elem: HTMLElement): TextDirection;
