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

/** Named sort keys for course lists (URL `sort`, localStorage, filter UI). */
export const CourseSortBy = {
  DateCreated: 'date_created',
  Published: 'published',
  Lessons: 'lessons'
} as const;

export type CourseSortBy = (typeof CourseSortBy)[keyof typeof CourseSortBy];

export const DEFAULT_COURSE_SORT: CourseSortBy = CourseSortBy.DateCreated;

/** URL `order` param and filter toggle (ascending vs descending). */
export const CourseSortOrder = {
  Asc: 'asc',
  Desc: 'desc'
} as const;

export type CourseSortOrder = (typeof CourseSortOrder)[keyof typeof CourseSortOrder];

export const DEFAULT_SORT_ORDER: CourseSortOrder = CourseSortOrder.Desc;

const COURSE_SORT_ORDER_VALUES = new Set<string>(Object.values(CourseSortOrder));

export function parseCourseSortOrder(value: string | null | undefined): CourseSortOrder {
  if (value != null && COURSE_SORT_ORDER_VALUES.has(value)) {
    return value as CourseSortOrder;
  }
  return DEFAULT_SORT_ORDER;
}

export const COURSE_SORT_OPTIONS = [
  { value: CourseSortBy.DateCreated, label: 'courses.course_filter.date_created' },
  { value: CourseSortBy.Published, label: 'courses.course_filter.published' },
  { value: CourseSortBy.Lessons, label: 'courses.course_filter.lessons' }
] as const;

const COURSE_SORT_VALUES = new Set<string>(Object.values(CourseSortBy));

/** Parses URL `sort` / stored sort strings into {@link CourseSortBy}; unknown values fall back to default. */
export function parseCourseSortValue(value: string | null | undefined): CourseSortBy {
  if (value == null || value === '') {
    return DEFAULT_COURSE_SORT;
  }
  if (COURSE_SORT_VALUES.has(value)) {
    return value as CourseSortBy;
  }
  return DEFAULT_COURSE_SORT;
}
