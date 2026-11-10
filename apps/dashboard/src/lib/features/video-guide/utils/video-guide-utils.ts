import type { VideoGuide } from './types';

export const VIDEO_GUIDES = {
  lessonBlocks: { videoId: '9hpGCqzypLk', titleKey: 'video_guide.lesson_blocks.title' },
  connectClaude: { videoId: 'E--DUOM-ftM', titleKey: 'video_guide.connect_claude.title' }
} as const satisfies Record<string, VideoGuide>;

export const LESSON_BLOCKS_COACH_MARK_KEY = 'classroomio:lesson-blocks-coach-mark-seen';

export function getVideoGuideEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`;
}

export function getVideoGuideThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}
