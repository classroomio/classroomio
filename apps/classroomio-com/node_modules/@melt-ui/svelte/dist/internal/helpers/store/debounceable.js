import { writable } from 'svelte/store';
export function debounceable(initialValue, wait = 0) {
    const store = writable({ value: initialValue, debounced: initialValue });
    let timeout;
    function debouncedSet(value) {
        store.update((state) => {
            state.value = value;
            return state;
        });
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            store.update((state) => {
                state.debounced = state.value;
                return state;
            });
        }, wait);
    }
    function debouncedUpdate(fn) {
        store.update((state) => {
            state.value = fn(state.value);
            return state;
        });
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            store.update((state) => {
                state.debounced = state.value;
                return state;
            });
        }, wait);
    }
    function set(value) {
        store.update((state) => {
            state.value = value;
            state.debounced = value;
            return state;
        });
    }
    function update(fn) {
        store.update((state) => {
            state.value = fn(state.value);
            state.debounced = state.value;
            return state;
        });
    }
    return {
        ...store,
        debouncedSet,
        debouncedUpdate,
        set,
        update,
    };
}
