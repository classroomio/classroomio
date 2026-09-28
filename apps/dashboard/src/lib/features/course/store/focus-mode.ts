import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isFocusMode = writable<boolean>(false);

export function setFocusMode(value: boolean) {
  isFocusMode.set(value);
  if (browser) {
    if (value) {
      document.body.classList.add('cio-focus-mode');
    } else {
      document.body.classList.remove('cio-focus-mode');
    }
    window.dispatchEvent(new CustomEvent('cio:focus-mode-change', { detail: { isFocusMode: value } }));
  }
}

export function toggleFocusMode() {
  isFocusMode.update((curr) => {
    const next = !curr;
    setFocusMode(next);
    return next;
  });
}

export function exitFocusMode() {
  setFocusMode(false);
}
