import MediaPlayer from './media-player.svelte';

export { MediaPlayer };
export { MediaPlayer as default };
export type { VideoSource, VideoType, MediaPlayerOptions } from './types';
export {
  formatYoutubeEmbedUrl,
  getYoutubeVideoId,
  isYoutubeUrl,
  formatVimeoEmbedUrl,
  getVimeoVideoId,
  isVimeoUrl,
  extractVimeoDetails,
  getVimeoVideoDetails,
  isValidVimeoLink,
  isGoogleDriveUrl,
  getVideoMediaType,
  getVideoType,
  type VideoMediaType,
  type VimeoVideoDetails
} from './utils';
