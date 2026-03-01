import MediaPlayer from './media-player.svelte';

export { MediaPlayer };
export { MediaPlayer as default };
export type { VideoSource, VideoType, MediaPlayerOptions } from './types';
export { formatYoutubeEmbedUrl, getYoutubeVideoId, isYoutubeUrl } from './utils';
