export interface CommentAuthor {
  id: string;
  fullname?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  roleBadge?: string | null;
}

export interface GenericComment {
  id: string | number;
  content: string | null;
  createdAt: string;
  authorProfileId?: string | null;
  authorFullname?: string | null;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  parentId?: number | null;
  replyCount?: number;
}

export interface CommentTreeNodeData {
  id: number;
  /** Absolute depth from the top of the rendered tree. */
  depth: number;
  children: CommentTreeNodeData[];
  /** Direct children in the database, which may exceed `children.length`. */
  directReplyCount: number;
  /** Whole subtree size in the database, including anything not loaded. */
  descendantCount: number;
  isLoading: boolean;
}

export interface CommentTreeLabels {
  collapse: string;
  expand: string;
  moreReplies: (count: number) => string;
  continueThread: string;
  collapsedSummary: (count: number) => string;
}
