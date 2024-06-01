import { derived, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface OpenModal {
  avatar: boolean;
  background: boolean;
  fullscreen: boolean;
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
  mood: false,
});

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

  // a mini validation for the htmlBody store that ensures all fields are filled
export const isFormComplete = derived(htmlBody, $htmlBody => {
  return $htmlBody.name.trim() !== '' &&
    $htmlBody.learning.trim() !== 'Tell us what you are learning' &&
    $htmlBody.progress > 0 &&
    $htmlBody.avatar.trim() !== '' &&
    $htmlBody.background.trim() !== '' &&
    $htmlBody.mood.text.trim() !== '' &&
    $htmlBody.mood.iconSrc.trim() !== '';
});
