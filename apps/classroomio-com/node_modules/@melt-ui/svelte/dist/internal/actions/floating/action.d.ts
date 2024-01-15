import type { FloatingConfig } from './types.js';
import { noop } from '../../helpers/index.js';
import type { VirtualElement } from '@floating-ui/core';
export declare function useFloating(reference: HTMLElement | VirtualElement | undefined, floating: HTMLElement | undefined, opts?: FloatingConfig): {
    destroy: typeof noop;
};
