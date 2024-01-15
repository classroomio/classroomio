import { noop } from './callbacks.js';
import { isHTMLElement } from './is.js';
/**
 * Adds an event listener to the specified target element(s) for the given event(s), and returns a function to remove it.
 * @param target The target element(s) to add the event listener to.
 * @param event The event(s) to listen for.
 * @param handler The function to be called when the event is triggered.
 * @param options An optional object that specifies characteristics about the event listener.
 * @returns A function that removes the event listener from the target element(s).
 */
export function addEventListener(target, event, handler, options) {
    const events = Array.isArray(event) ? event : [event];
    // Add the event listener to each specified event for the target element(s).
    events.forEach((_event) => target.addEventListener(_event, handler, options));
    // Return a function that removes the event listener from the target element(s).
    return () => {
        events.forEach((_event) => target.removeEventListener(_event, handler, options));
    };
}
export function addMeltEventListener(target, event, handler, options) {
    const events = Array.isArray(event) ? event : [event];
    if (typeof handler === 'function') {
        const handlerWithMelt = withMelt((_event) => handler(_event));
        // Add the event listener to each specified event for the target element(s).
        events.forEach((_event) => target.addEventListener(_event, handlerWithMelt, options));
        // Return a function that removes the event listener from the target element(s).
        return () => {
            events.forEach((_event) => target.removeEventListener(_event, handlerWithMelt, options));
        };
    }
    return () => noop();
}
export function dispatchMeltEvent(originalEvent) {
    const node = originalEvent.currentTarget;
    if (!isHTMLElement(node))
        return null;
    const customMeltEvent = new CustomEvent(`m-${originalEvent.type}`, {
        detail: {
            originalEvent,
        },
        cancelable: true,
    });
    node.dispatchEvent(customMeltEvent);
    return customMeltEvent;
}
export function withMelt(handler) {
    return (event) => {
        const customEvent = dispatchMeltEvent(event);
        if (customEvent?.defaultPrevented)
            return;
        return handler(event);
    };
}
