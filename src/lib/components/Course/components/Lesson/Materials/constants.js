import { Video, Notebook, PresentationFile } from 'carbon-icons-svelte';

export const tabs = [
  {
    label: 'Note',
    icon: Notebook,
    value: 1,
    badgeValue: 0
  },
  {
    label: 'Slide',
    icon: PresentationFile,
    value: 2,
    badgeValue: 0
  },
  {
    label: 'Video',
    icon: Video,
    value: 3,
    badgeValue: 0
  }
];
