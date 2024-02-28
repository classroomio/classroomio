export interface Author {
  id: string;
  username: string;
  fullname: string;
  avatar_url: string;
}

export interface Comment {
  id: string;
  created_at: string;
  content: string;
  author: {
    profile: Author;
  };
}

export interface Reaction {
  smile: string[];
  thumbsup: string[];
  thumbsdown: string[];
  clap: string[];
}

export interface FeedApi {
  id: string;
  content: string;
  author: {
    profile: Author;
  };
  created_at: string;
  comment: Comment[];
  reaction: Reaction[];
  is_pinned: false;
}

export interface Feed {
  id: string;
  content: string;
  author: {
    profile: Author;
  };
  created_at: string;
  comment: Comment[];
  reaction: Reaction[];
  isPinned: boolean;
}
