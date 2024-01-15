// Modified from Grail UI v0.9.6 (2023-06-10)
// Source: https://github.com/grail-ui/grail-ui
// https://github.com/grail-ui/grail-ui/tree/master/packages/grail-ui/src/focusTrap/focusTrap.ts
import { writable, readonly } from 'svelte/store';
import { createFocusTrap as _createFocusTrap } from 'focus-trap';
export function createFocusTrap(config = {}) {
    let trap;
    const { immediate, ...focusTrapOptions } = config;
    const hasFocus = writable(false);
    const isPaused = writable(false);
    const activate = (opts) => trap?.activate(opts);
    const deactivate = (opts) => {
        trap?.deactivate(opts);
    };
    const pause = () => {
        if (trap) {
            trap.pause();
            isPaused.set(true);
        }
    };
    const unpause = () => {
        if (trap) {
            trap.unpause();
            isPaused.set(false);
        }
    };
    const useFocusTrap = (node) => {
        trap = _createFocusTrap(node, {
            ...focusTrapOptions,
            onActivate() {
                hasFocus.set(true);
                config.onActivate?.();
            },
            onDeactivate() {
                hasFocus.set(false);
                config.onDeactivate?.();
            },
        });
        if (immediate) {
            activate();
        }
        return {
            destroy() {
                deactivate();
                trap = undefined;
            },
        };
    };
    return {
        useFocusTrap,
        hasFocus: readonly(hasFocus),
        isPaused: readonly(isPaused),
        activate,
        deactivate,
        pause,
        unpause,
    };
}
