import { writable } from 'svelte/store';
import type {Writable} from 'svelte/store'

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
  }
}

// report html
export const htmlBody: Writable<HtmlBody> = writable({
  name: "",
  learning: "Tell us what you are learning",
  progress: 0,
  avatar: "",
  background: "",
  mood: {
    text: "",
    iconSrc: ""
  }
})

// store for the node binded to the report component for the component to image conversion
export const nodeStore = writable(null);

export const OpenMood: Writable<Modal> = writable({
  open: false
})

export const OpenAvatar: Writable<Modal> = writable({
  open: false
})

export const OpenBackground: Writable<Modal> = writable({
  open: false
})

export const OpenFullscreen: Writable<Modal> = writable({
  open: false
})

// mood functions
export function closeMoodModal() {
  OpenMood.update(store => {
    store.open = false;
    return store;
  });
}

export function openMoodModal() {
  OpenMood.update(store => {
    store.open = true;
    return store;
  });
}

// avatar functions
export function closeAvatarModal() {
  OpenAvatar.update(store => {
    store.open = false;
    return store;
  });
}

export function openAvatarModal() {
  OpenAvatar.update(store => {
    store.open = true;
    return store;
  });
}

// background functions
export function closeBackgroundModal() {
  OpenBackground.update(store => {
    store.open = false;
    return store;
  });
}

export function openBackgroundModal() {
  OpenBackground.update(store => {
    store.open = true;
    return store;
  });
}

// fullscreen functions
export function closeFullscreenModal() {
  OpenFullscreen.update(store => {
    store.open = false;
    return store;
  });
}

export function toggleFullscreenModal() {
  OpenFullscreen.update(store => {
    store.open = !store.open;
    return store;
  });
}