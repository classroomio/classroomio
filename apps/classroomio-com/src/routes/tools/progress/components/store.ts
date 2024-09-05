import { derived, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface OpenModal {
  avatar: boolean;
  background: boolean;
  fullscreen: boolean;
  showFullscreenButton: boolean;
  mood: boolean;
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

// store for the node binded to the report component for the component to image conversion
export const nodeStore = writable(null);

export const openModal: Writable<OpenModal> = writable({
  avatar: false,
  background: false,
  fullscreen: false,
  showFullscreenButton: true,
  mood: false
});

const placeholderLearning = 'Tell us what you are learning';

// report html
export const htmlBody: Writable<HtmlBody> = writable({
  name: '',
  learning: placeholderLearning,
  progress: 10,
  avatar: '',
  background: '',
  mood: {
    text: '',
    iconSrc: ''
  }
});

// a mini validation for the htmlBody store that ensures all fields are filled
export const isFormComplete = derived(htmlBody, ($htmlBody) => {
  return !!(
    $htmlBody.name.trim() &&
    $htmlBody.learning.trim() !== placeholderLearning &&
    $htmlBody.progress > 0 &&
    $htmlBody.mood.text.trim() &&
    $htmlBody.mood.iconSrc.trim()
  );
});
