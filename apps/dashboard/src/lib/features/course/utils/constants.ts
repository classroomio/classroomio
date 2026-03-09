export const ROUTES = {
  COURSES: 'courses',
  LESSONS: 'lessons'
};

export const EXERCISE_TEMPLATE_TAGS = {
  HTML: 'HTML',
  CSS: 'CSS',
  JS: 'JS',
  Typescript: 'Typescript',
  ReactJS: 'ReactJS',
  VueJS: 'VueJS',
  NodeJS: 'NodeJS',
  Python: 'Python',
  PHP: 'PHP',
  GIT: 'GIT'
};

export const COURSE_SORT_OPTIONS = [
  { value: '0', label: 'courses.course_filter.date_created' },
  { value: '1', label: 'courses.course_filter.published' },
  { value: '2', label: 'courses.course_filter.lessons' }
] as const;
