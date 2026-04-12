import FileSymlinkIcon from '@lucide/svelte/icons/file-symlink';
import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
import LibraryIcon from '@lucide/svelte/icons/library';
import VideoIcon from '@lucide/svelte/icons/video';
import YoutubeIcon from '@lucide/svelte/icons/youtube';

export const videoTabs = [
  {
    value: 1,
    title: 'course.navItem.lessons.materials.tabs.video.add_video.youtube_link',
    icon: YoutubeIcon
  },
  {
    value: 2,
    title: 'course.navItem.lessons.materials.tabs.video.embed_link',
    icon: FileSymlinkIcon
  },
  {
    value: 3,
    title: 'course.navItem.lessons.materials.tabs.video.upload',
    icon: VideoIcon
  },
  {
    value: 4,
    title: 'course.navItem.lessons.materials.tabs.video.library',
    icon: LibraryIcon
  },
  {
    value: 5,
    title: 'course.navItem.lessons.materials.tabs.video.google_drive',
    icon: HardDriveIcon
  }
];
