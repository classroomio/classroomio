import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type CourseDetailResponse = Extract<
  InferResponseType<ApiClient['course'][':courseId']['$get'], 200>,
  { success: true }
>;

export type CourseDetail = CourseDetailResponse['data'];

export type CourseContent = CourseDetail['content'];

export type CourseSection = CourseContent['sections'][number];

export type CourseContentItem = CourseContent['items'][number];

/** How a row in the outline reads to the learner, derived from the server's completion and access fields. */
export type ContentItemState = 'complete' | 'current' | 'available' | 'locked';

export type OutlineSection = { id: string; title: string | null; items: CourseContentItem[] };
