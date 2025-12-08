export interface CommunityQuestion {
  title: string;
  courseId: string;
  courseTitle: string;
  slug: string;
  votes: number;
  createdAt: string;
  organizationId: string;
  authorFullname: string;

  // -- adjusted them because there's a difference between the single question and multiple questions fetch
  comments: Comment[] | number;
  id?: number;
  body?: string;
  authorId?: string;
  authorAvatarUrl?: string;
}

export interface Comment {
  id: string;
  body: string;
  votes: number;
  created_at: string;
  author: {
    id: string;
    fullname: string;
    avatar_url: string;
  };
}
