import { writable } from 'svelte/store';

export const deleteMemberModal = writable({
  open: false
});

export const qrInviteNodeStore = writable(null);
