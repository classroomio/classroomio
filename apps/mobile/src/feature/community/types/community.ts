import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type SuccessOf<Body> = Extract<Body, { success: true }>;

type QuestionsResponse = SuccessOf<InferResponseType<ApiClient['community']['$get'], 200>>;
type QuestionResponse = SuccessOf<InferResponseType<ApiClient['community'][':slug']['$get'], 200>>;
type AskResponse = SuccessOf<InferResponseType<ApiClient['community']['compose']['question']['$post'], 201>>;

export type CommunityQuestionSummary = QuestionsResponse['data'][number];

export type CommunityQuestion = QuestionResponse['data'];

export type CommunityAnswer = CommunityQuestion['comments'][number];

export type AskedQuestion = AskResponse['data'];

export type QuestionFields = { title: string; body: string; courseId: string };

export type CourseOption = { id: string; title: string };
