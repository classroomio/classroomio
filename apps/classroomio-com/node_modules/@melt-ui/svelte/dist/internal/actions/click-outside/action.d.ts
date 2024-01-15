import type { ClickOutsideConfig } from './types.js';
export declare const useClickOutside: (node: HTMLElement, config?: ClickOutsideConfig) => {
    update(params: Partial<ClickOutsideConfig>): void;
    destroy(): void;
};
