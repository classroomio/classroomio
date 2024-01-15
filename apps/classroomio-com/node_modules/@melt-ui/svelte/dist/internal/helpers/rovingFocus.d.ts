/**
 * Manage roving focus between elements. Sets the current active element to
 * tabindex -1 and the next element to tabindex 0.
 *
 * @param nextElement The element to focus on
 */
export declare function handleRovingFocus(nextElement: HTMLElement): void;
export declare function getNextFocusable(currentElement: HTMLElement): HTMLElement | null;
export declare function getPreviousFocusable(currentElement: HTMLElement): HTMLElement | null;
