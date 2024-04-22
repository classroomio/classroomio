import Link from 'carbon-icons-svelte/lib/Link.svelte';
import Video from 'carbon-icons-svelte/lib/Video.svelte';

import DirectLink from 'carbon-icons-svelte/lib/DirectLink.svelte';

export const videoTabs = [
  {
    value: 1,
    title: 'course.navItem.lessons.materials.tabs.video.add_video.youtube_link',
    icon: Link
  },
  {
    value: 2,
    title: 'course.navItem.lessons.materials.tabs.video.embed_link',
    icon: DirectLink
  },
  {
    value: 3,
    title: 'course.navItem.lessons.materials.tabs.video.upload',
    icon: Video
  }
];
