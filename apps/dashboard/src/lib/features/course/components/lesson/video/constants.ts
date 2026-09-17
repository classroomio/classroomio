import FileSymlinkIcon from '@lucide/svelte/icons/file-symlink';
import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
import LibraryIcon from '@lucide/svelte/icons/library';
import VideoIcon from '@lucide/svelte/icons/video';
import YoutubeIcon from '@lucide/svelte/icons/youtube';
import { VimeoIcon } from '@cio/ui/custom/vimeo-link-form';

export const videoTabs = [
  {
    value: 'youtube',
    title: 'course.navItem.lessons.materials.tabs.video.add_video.youtube_link',
    icon: YoutubeIcon
  },
  {
    value: 'vimeo',
    title: 'course.navItem.lessons.materials.tabs.video.add_video.vimeo_link',
    icon: VimeoIcon
  },
  {
    value: 'embed',
    title: 'course.navItem.lessons.materials.tabs.video.embed_link',
    icon: FileSymlinkIcon
  },
  {
    value: 'upload',
    title: 'course.navItem.lessons.materials.tabs.video.upload',
    icon: VideoIcon
  },
  {
    value: 'library',
    title: 'course.navItem.lessons.materials.tabs.video.library',
    icon: LibraryIcon
  },
  {
    value: 'google_drive',
    title: 'course.navItem.lessons.materials.tabs.video.google_drive',
    icon: HardDriveIcon
  }
];
