import { derived } from 'svelte/store';
/**
 * Helper function to standardize the way we derive a visible state for the
 * popper/floating elements.
 */
export function derivedVisible(obj) {
    const { open, forceVisible, activeTrigger } = obj;
    return derived([open, forceVisible, activeTrigger], ([$open, $forceVisible, $activeTrigger]) => ($open || $forceVisible) && $activeTrigger !== null);
}
