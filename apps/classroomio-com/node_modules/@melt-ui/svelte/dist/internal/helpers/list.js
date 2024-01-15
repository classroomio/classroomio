import { isHTMLElement } from './is.js';
/** Retrieves all option descendants of a given element. */
export function getOptions(el) {
    return Array.from(el.querySelectorAll('[role="option"]:not([data-disabled])')).filter((el) => isHTMLElement(el));
}
/** Retrieves the first option descendant of a given element. */
export function getFirstOption(el) {
    const firstOption = el.querySelector('[role="option"]:not([data-disabled])');
    return isHTMLElement(firstOption) ? firstOption : null;
}
