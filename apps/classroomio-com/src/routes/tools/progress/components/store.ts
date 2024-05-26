import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface Mood {
  text: string;
  iconSrc: string;
}
export interface Source {
  src: string;
}

interface Modal {
  open: boolean;
}

export interface HtmlBody {
  name: string;
  learning: string;
  progress: number;
  avatar: string;
  background: string;
  mood: {
    text: string;
    iconSrc: string;
  };
}

// report html
export const htmlBody: Writable<HtmlBody> = writable({
  name: '',
  learning: 'Tell us what you are learning',
  progress: 10,
  avatar: '',
  background: '',
  mood: {
    text: '',
    iconSrc: ''
  }
});

// store for the node binded to the report component for the component to image conversion
export const nodeStore = writable(null);

export const openMood: Writable<Modal> = writable({
  open: false
});

export const openAvatar: Writable<Modal> = writable({
  open: false
});

export const openBackground: Writable<Modal> = writable({
  open: false
});

export const openFullscreen: Writable<Modal> = writable({
  open: false
});

// mood functions
export function closeMoodModal() {
  openMood.update((store) => {
    store.open = false;
    return store;
  });
}

export function openMoodModal() {
  openMood.update((store) => {
    store.open = true;
    return store;
  });
}

// avatar functions
export function closeAvatarModal() {
  openAvatar.update((store) => {
    store.open = false;
    return store;
  });
}

export function openAvatarModal() {
  openAvatar.update((store) => {
    store.open = true;
    return store;
  });
}

// background functions
export function closeBackgroundModal() {
  openBackground.update((store) => {
    store.open = false;
    return store;
  });
}

export function openBackgroundModal() {
  openBackground.update((store) => {
    store.open = true;
    return store;
  });
}

// fullscreen functions
export function closeFullscreenModal() {
  openFullscreen.update((store) => {
    store.open = false;
    return store;
  });
}

export function toggleFullscreenModal() {
  openFullscreen.update((store) => {
    store.open = !store.open;
    return store;
  });
}
