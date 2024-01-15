/**
 * Detects the text direction in the element.
 * @returns {TextDirection} The text direction ('ltr' for left-to-right or 'rtl' for right-to-left).
 */
export function getElemDirection(elem) {
    const style = window.getComputedStyle(elem);
    const direction = style.getPropertyValue('direction');
    return direction;
}
