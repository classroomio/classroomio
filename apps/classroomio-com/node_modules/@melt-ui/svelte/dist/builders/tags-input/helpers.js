import { getElementByMeltId, isHTMLElement, isHTMLInputElement, } from '../../internal/helpers/index.js';
export function focusInput(id, pos = 'default') {
    const inputEl = getElementByMeltId(id);
    if (!isHTMLInputElement(inputEl))
        return;
    inputEl.focus();
    if (pos === 'start') {
        inputEl.setSelectionRange(0, 0);
    }
    else if (pos === 'end') {
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    }
}
export function setSelectedFromEl(el, selected) {
    if (!el) {
        selected.set(null);
        return;
    }
    selected.set({
        id: el.getAttribute('data-tag-id') ?? '',
        value: el.getAttribute('data-tag-value') ?? '',
    });
}
export function highlightText(query) {
    const el = document.querySelector(query);
    if (!isHTMLElement(el))
        return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
