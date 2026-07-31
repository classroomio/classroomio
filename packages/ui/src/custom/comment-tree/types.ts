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
