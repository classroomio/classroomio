interface Comment {
  id: string;
  created_at: string;
  content: string;
  avatar: string;
  author: string;
}

interface Emoji {
  name: string;
  emoji?: string;
  count: number;
}

export interface Anouncements {
  id: string;
  image: string;
  content: string;
  author: string;
  created_at: string;
  comments: Comment[];
  emoji: Emoji[];
}
