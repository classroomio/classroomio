import { describe, expect, it } from 'vitest';

import type { AiAssistantMessage } from './types';
import { extractChangedItemsFromMessages } from './run-summary';

describe('extractChangedItemsFromMessages', () => {
  it('includes the lesson changed by a YouTube video attachment', () => {
    const messages = [
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-add_youtube_video_to_lesson',
            state: 'output-available',
            input: { lessonId: 'lesson-1', videoUrl: 'https://www.youtube.com/watch?v=video' },
            output: { lessonId: 'lesson-1', lessonTitle: 'Video lesson' }
          }
        ]
      }
    ] as unknown as AiAssistantMessage[];

    expect(extractChangedItemsFromMessages(messages)).toEqual([
      {
        targetType: 'lesson',
        targetId: 'lesson-1',
        title: 'Video lesson',
        actions: [{ kind: 'metadata_updated' }]
      }
    ]);
  });
});
