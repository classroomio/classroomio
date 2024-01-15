import { derived } from 'svelte/store';
export function derivedFromObject(stores, fn) {
    return derived(Object.values(stores), (values) => {
        // map the values back to the keys
        const valuesObj = Object.fromEntries(Object.keys(stores).map((key, i) => [`$${key}`, values[i]]));
        return fn(valuesObj);
    });
}
