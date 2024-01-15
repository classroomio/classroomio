/**
 * Resize observer singleton.
 * One listener per element only!
 * https://groups.google.com/a/chromium.org/g/blink-dev/c/z6ienONUb5A/m/F5-VcUZtBAAJ
 */
export declare class ResizeObserverSingleton {
    readonly options?: ResizeObserverOptions;
    constructor(options?: ResizeObserverOptions);
    observe(element: Element, listener: Listener): () => void;
    private readonly _listeners;
    private _observer?;
    private _getObserver;
}
declare type Listener = (entry: ResizeObserverEntry) => any;
interface ResizeObserverSize {
    readonly blockSize: number;
    readonly inlineSize: number;
}
interface ResizeObserverEntry {
    readonly borderBoxSize: readonly ResizeObserverSize[];
    readonly contentBoxSize: readonly ResizeObserverSize[];
    readonly contentRect: DOMRectReadOnly;
    readonly devicePixelContentBoxSize: readonly ResizeObserverSize[];
    readonly target: Element;
}
declare type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';
interface ResizeObserverOptions {
    box?: ResizeObserverBoxOptions;
}
export {};
