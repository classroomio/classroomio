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
  id: string;
  created_at: string;
  author_id: string; //foreign key to groupmember.id
  content: string;
  course_id: string; // foreign key to course.id
}

interface course_announcement_comment {
  id: string;
  created_at: string;
  author_id: string; //foreign key to groupmember.id
  content: string;
  course_announcement_id: string; // foreign key to course_announcement.id
}

interface course_announcement_reaction {
  id: string;
  created_at: string;
  selectedby: string; //foreign key to groupmember.id
  reaction: string;
  course_announcement_id: string; // foreign key to course_announcement.id
}

// const announcement: Announcement = {
//   id: '1',
//   image: 'announcement_image.jpg',
//   content: 'This is an announcement!',
//   author: { id: 'author_id', username: 'author_username', fullname: 'Author Name' },
//   created_at: '2024-02-07',
//   comments: [
//     {
//       id: '1',
//       content: 'Comment 1',
//       author: {
//         id: 'comment_author_id',
//         username: 'comment_author_username',
//         fullname: 'Comment Author'
//       },
//       created_at: '2024-02-07'
//     },
//     {
//       id: '2',
//       content: 'Comment 2',
//       author: {
//         id: 'comment_author_id',
//         username: 'comment_author_username',
//         fullname: 'Comment Author'
//       },
//       created_at: '2024-02-07'
//     }
//   ],
//   emojis: [
//     {
//       smile: [
//         { id: '1', username: 'user1', fullname: 'User One' },
//         { id: '2', username: 'user2', fullname: 'User Two' }
//       ],
//       heart: [
//         { id: '3', username: 'user3', fullname: 'User Three' },
//         { id: '4', username: 'user4', fullname: 'User Four' }
//       ],
//       laugh: [{ id: '5', username: 'user5', fullname: 'User Five' }],
//       love: [
//         { id: '6', username: 'user6', fullname: 'User Six' },
//         { id: '7', username: 'user7', fullname: 'User Seven' },
//         { id: '8', username: 'user8', fullname: 'User Eight' }
//       ]
//     }
//   ]
// };
