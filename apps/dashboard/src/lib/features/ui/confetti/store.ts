import { writable } from 'svelte/store';

export const confettiStore = writable({
  show: false
});

export function toggleConfetti() {
  confettiStore.update((confetti) => ({
    ...confetti,
    show: !confetti.show
  }));
}
