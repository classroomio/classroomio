import type { InferResponseType } from '@cio/api/rpc-types';
import type { LucideIcon } from 'lucide-react-native';

import type { ApiClient } from '@/feature/common/api/api-client';
import type { en } from '@/feature/newsfeed/translations/en';

type SuccessOf<Body> = Extract<Body, { success: true }>;

type CourseRoutes = ApiClient['course'][':courseId'];

type PostsResponse = SuccessOf<InferResponseType<CourseRoutes['newsfeed']['$get'], 200>>;
type PostResponse = SuccessOf<InferResponseType<CourseRoutes['newsfeed'][':feedId']['$get'], 200>>;
type CommentsResponse = SuccessOf<InferResponseType<CourseRoutes['newsfeed'][':feedId']['comments']['$get'], 200>>;
type ViewerResponse = SuccessOf<InferResponseType<CourseRoutes['newsfeed-viewer']['$get'], 200>>;

export type NewsfeedPage = PostsResponse['data'];

export type NewsfeedPost = NewsfeedPage['items'][number];

export type NewsfeedPostRecord = PostResponse['data'];

export type NewsfeedCommentPage = CommentsResponse['data'];

export type NewsfeedComment = NewsfeedCommentPage['items'][number];

export type NewsfeedViewer = ViewerResponse['data'];

export type ReactionType = 'clap' | 'smile' | 'thumbsup' | 'thumbsdown';

export type ReactionRecord = Record<ReactionType, string[]>;

export type ReactionOption = { type: ReactionType; labelKey: keyof typeof en; icon: LucideIcon };

/** Comments of one post, normalised so pages of roots and replies can be merged in place. */
export type CommentThread = {
  byId: Record<string, NewsfeedComment>;
  rootIds: number[];
  childIds: Record<string, number[]>;
  hasMoreRoots: boolean;
  rootCursor: string | null;
  totalCommentCount: number;
};

export type ThreadRow =
  | { type: 'comment'; key: string; comment: NewsfeedComment; depth: number }
  | { type: 'more-replies'; key: string; parentId: number; depth: number; remaining: number };
