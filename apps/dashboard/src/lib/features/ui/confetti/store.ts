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

export function setConfetti(show: boolean) {
  confettiStore.update((confetti) => ({
    ...confetti,
    show
  }));
}
