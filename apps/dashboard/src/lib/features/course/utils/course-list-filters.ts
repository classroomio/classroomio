import {
  DEFAULT_COURSE_SORT,
  DEFAULT_SORT_ORDER,
  parseCourseSortOrder,
  parseCourseSortValue,
  type CourseSortBy as CourseSortByType,
  type CourseSortOrder as CourseSortOrderType
} from './constants';

export type PublishedStatusFilter = 'all' | 'published' | 'unpublished';

export interface CourseListFilters {
  search: string;
  tags: string[];
  sortKey: CourseSortByType;
  order: CourseSortOrderType;
  courseType: string;
  publishedStatus: PublishedStatusFilter;
}

export const COURSE_LIST_FILTER_PARAM_KEYS = ['search', 'tags', 'sort', 'order', 'type', 'status', 'next'] as const;

export const DEFAULT_COURSE_LIST_FILTERS: CourseListFilters = {
  search: '',
  tags: [],
  sortKey: DEFAULT_COURSE_SORT,
  order: DEFAULT_SORT_ORDER,
  courseType: 'all',
  publishedStatus: 'all'
};

export const ORG_COURSES_PAGE_SIZE = 20;
export const DEFAULT_COURSE_LIST_NEXT = 1;
export const MAX_COURSE_LIST_NEXT = 50;

const VALID_COURSE_TYPES = new Set(['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE', 'PUBLIC']);

export function parsePublishedStatusFilter(value: string | null | undefined): PublishedStatusFilter {
  if (value === 'published' || value === 'unpublished') {
    return value;
  }

  return 'all';
}

export function parseCourseListNext(params: URLSearchParams): number {
  const raw = Number(params.get('next'));

  if (!Number.isInteger(raw) || raw < DEFAULT_COURSE_LIST_NEXT) {
    return DEFAULT_COURSE_LIST_NEXT;
  }

  return Math.min(raw, MAX_COURSE_LIST_NEXT);
}

export function parseCourseListFilters(params: URLSearchParams): CourseListFilters {
  const tagsParam = params.get('tags');
  const tags = tagsParam
    ? tagsParam
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const typeParam = params.get('type')?.trim();
  const courseType = typeParam && VALID_COURSE_TYPES.has(typeParam) ? typeParam : 'all';

  return {
    search: params.get('search')?.trim() ?? '',
    tags,
    sortKey: parseCourseSortValue(params.get('sort')),
    order: parseCourseSortOrder(params.get('order')),
    courseType,
    publishedStatus: parsePublishedStatusFilter(params.get('status'))
  };
}

export function buildCourseListSearchParams(
  filters: CourseListFilters,
  next = DEFAULT_COURSE_LIST_NEXT
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  }

  if (filters.sortKey !== DEFAULT_COURSE_SORT) {
    params.set('sort', filters.sortKey);
  }

  if (filters.order !== DEFAULT_SORT_ORDER) {
    params.set('order', filters.order);
  }

  if (filters.courseType !== 'all') {
    params.set('type', filters.courseType);
  }

  if (filters.publishedStatus === 'published' || filters.publishedStatus === 'unpublished') {
    params.set('status', filters.publishedStatus);
  }

  if (next > DEFAULT_COURSE_LIST_NEXT) {
    params.set('next', String(next));
  }

  return params;
}

export function mergeCourseListSearchParams(
  current: URLSearchParams,
  filters: CourseListFilters,
  next = DEFAULT_COURSE_LIST_NEXT
): URLSearchParams {
  const nextParams = new URLSearchParams(current);

  for (const key of COURSE_LIST_FILTER_PARAM_KEYS) {
    nextParams.delete(key);
  }

  const built = buildCourseListSearchParams(filters, next);
  built.forEach((value, key) => {
    nextParams.set(key, value);
  });

  return nextParams;
}
