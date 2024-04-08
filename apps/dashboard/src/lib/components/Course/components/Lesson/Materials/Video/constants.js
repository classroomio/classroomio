import Link from 'carbon-icons-svelte/lib/Link.svelte';
import Video from 'carbon-icons-svelte/lib/Video.svelte';
import DirectLink from 'carbon-icons-svelte/lib/DirectLink.svelte';

export const videoTabs = [
  {
    value: 1,
    title: 'Youtube Link',
    icon: Link
  },
  {
    value: 2,
    title: 'Embed Link',
    icon: DirectLink
  },
  {
    value: 3,
    title: 'Upload',
    icon: Video
  }
];
