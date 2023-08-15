export const mockData = [
  {
    title: 'Photo editing 101',
    description:
      'Learn the different techniques to edit photos using Adobe Lightroom.Learn the basics of figma and start design web apps for the world ...Learn the basics of figma and start design web apps for the world ...',
    author: 'Derrick Amenuvue',
    lessons: 8,
    inProgress: true,
    completed: false,
    src: '/digital.svg',
    progress: 'w-[45%]',
    progressRate: 45
  },
  {
    title: 'Colorful digital painting',
    description:
      'Learn the different techniques to edit photos using Adobe Lightroom.Learn the basics of figma and start design web apps for the world ...Learn the basics of figma and start design web apps for the world ...',
    author: 'Derrick Amenuvue',
    inProgress: true,
    completed: false,
    lessons: 5,
    src: '/painting.svg',
    progress: 'w-[30%]',
    progressRate: 45
  },
  {
    title: 'AI for dummys',
    description:
      'Learn the different techniques to edit photos using Adobe Lightroom.Learn the basics of figma and start design web apps for the world ...Learn the basics of figma and start design web apps for the world ...',
    author: 'Derrick Amenuvue',
    inProgress: false,
    completed: false,
    lessons: 18,
    src: '/digital.svg',
    progress: 'w-[45%]',
    progressRate: 45
  }
];
export const courseInProgress = mockData.filter((course) => course.inProgress);
export const courseCompleted = mockData.filter((course) => course.completed);
export const totalCourses = mockData.length;
export const progressPercentage = Math.round((courseInProgress.length / totalCourses) * 100);
