export function debounce(fn, wait = 500) {
    let timeout = null;
    return function (...args) {
        const later = () => {
            timeout = null;
            fn(...args);
        };
        timeout && clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
