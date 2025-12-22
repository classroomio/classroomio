import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetCommunityQuestionsResponse = typeof classroomio.community.$get;
export type CommunityQuestionsResponse = InferResponseType<GetCommunityQuestionsResponse> | null;
export type CommunityQuestionsSuccess = Extract<InferResponseType<GetCommunityQuestionsResponse>, { success: true }>;
export type CommunityQuestionData = CommunityQuestionsSuccess['data'];

export type GetCommunityQuestionResponse = (typeof classroomio.community)[':slug']['$get'];
export type CommunityQuestionResponse = InferResponseType<GetCommunityQuestionResponse> | null;
export type CommunityQuestionSuccess = Extract<InferResponseType<GetCommunityQuestionResponse>, { success: true }>;

export type CreateCommentResponse = typeof classroomio.community.$post;
export type CreateCommentSuccess = Extract<InferResponseType<CreateCommentResponse>, { success: true }>;
export type CreateCommentData = CreateCommentSuccess['data'];

export type UpvotePostResponse = (typeof classroomio.community)[':id']['upvote']['$post'];
export type UpvotePostSuccess = Extract<InferResponseType<UpvotePostResponse>, { success: true }>;
export type UpvotePostData = UpvotePostSuccess['data'];

export type CreateCommunityQuestionResponse = typeof classroomio.community.$post;
export type CreateCommunityQuestionSuccess = Extract<
  InferResponseType<CreateCommunityQuestionResponse>,
  { success: true }
>;
export type UpdateQuestionResponse = (typeof classroomio.community)[':id']['$put'];
export type UpdateQuestionSuccess = Extract<InferResponseType<UpdateQuestionResponse>, { success: true }>;
export type UpdateQuestionData = UpdateQuestionSuccess['data'];
