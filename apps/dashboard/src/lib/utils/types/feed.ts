interface Author {
  id: string;
  username: string;
  fullname: string;
  avatar: string;
}

interface Comment {
  id: string;
  created_at: string;
  content: string;
  avatar: string;
  author: Author;
}

interface Emoji {
  [key: string]: {
    id: string;
    username: string;
    fullname: string;
  }[];
}

export interface Feed {
  id: string;
  image: string;
  content: string;
  author: Author;
  created_at: string;
  comments: Comment[];
  emoji: Emoji[];
}

// interface for Database structure

interface Course_Newsfeed {
  id?: string;
  created_at?: string;
  author_id?: string; //foreign key to groupmember.id
  content?: string;
  course_id?: string; // foreign key to course.id
}

interface course_Newsfeed_Comment {
  id?: string;
  created_at?: string;
  author_id?: string; //foreign key to groupmember.id
  content?: string;
  course_newsfeed_id: string; // foreign key to course_newsfeed.id
}
