import { writable } from 'svelte/store';

/** License-gated features enabled for this instance. Set from layout load. */
export const licenseFeatures = writable<string[]>([]);
