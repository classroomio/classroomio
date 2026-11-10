import type { VideoGuide } from './types';

export const VIDEO_GUIDES = {
  lessonBlocks: { videoId: '9hpGCqzypLk', titleKey: 'video_guide.lesson_blocks.title' },
  connectClaude: { videoId: 'E--DUOM-ftM', titleKey: 'video_guide.connect_claude.title' }
} as const satisfies Record<string, VideoGuide>;

export const LESSON_BLOCKS_COACH_MARK_KEY = 'classroomio:lesson-blocks-coach-mark-seen';
