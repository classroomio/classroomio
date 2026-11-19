const INNER_CONTROL_SELECTOR = 'button, label, input, a';

/**
 * True when a click on an option card landed on one of its own controls (the radio or checkbox,
 * its label, or the image enlarge button), which already handle the click themselves.
 */
export function isOptionCardControlClick(event: MouseEvent): boolean {
  const target = event.target;

  return target instanceof Element && target.closest(INNER_CONTROL_SELECTOR) !== null;
}
