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

export interface Announcement {
  id: string;
  image: string;
  content: string;
  author: Author;
  created_at: string;
  comments: Comment[];
  emoji: Emoji[];
}

// interface for Database structure

interface course_announcement {
  id?: string;
  created_at?: string;
  author_id?: string; //foreign key to groupmember.id
  content?: string;
  course_id?: string; // foreign key to course.id
}

interface course_announcement_comment {
  id?: string;
  created_at?: string;
  author_id?: string; //foreign key to groupmember.id
  content?: string;
  course_announcement_id: string; // foreign key to course_announcement.id
}
