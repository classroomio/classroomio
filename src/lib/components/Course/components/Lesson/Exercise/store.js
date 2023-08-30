import { writable } from 'svelte/store';
import MODES from '$lib/utils/constants/mode.js';
import { ROLE } from '$lib/utils/constants/roles';

export const exerciseMode = writable({
  editMode: true
});
