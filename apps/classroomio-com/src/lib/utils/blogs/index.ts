enum Tags {
  ANNOUNCEMENT = 'Announcement',
  COMMUNITY = 'Community',
  DEVELOPMENT = 'Development',
  METRICS = 'Metrics',
  LAUNCH = 'Launch',
  TUTORIAL = 'Tutorial'
}

interface Blog {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: Tags[];
  author: {
    avatar: string;
    name: string;
    role: string;
  };
}

const author: Blog['author'] = {
  avatar: '/blog/rotimi-best-avatar.jpeg',
  name: 'ClassroomIO',
  role: 'Founder'
};

export const blogs: Blog[] = [
  {
    slug: 'build-a-course-in-less-than-10-minutes',
    title: 'Build a course in less than 10 minutes with AI',
    date: '2023-10-16',
    summary:
      'In this post you will learn how you can leverage AI on classroomio.com to help you build courses 10x faster',
    tags: [Tags.TUTORIAL],
    author
  },
  {
    slug: 'merry-christmas-classroomio-v1',
    title: 'Merry Christmas ClassroomIO v1',
    date: '2023-12-25',
    summary:
      'Merry Christmas ClassroomIO v1. This is the first version of ClassroomIO. It is a simple app that allows teachers to create and manage their classrooms. It also allows students to join classrooms and view their assignments.',
    tags: [Tags.ANNOUNCEMENT, Tags.LAUNCH],
    author
  }
];
