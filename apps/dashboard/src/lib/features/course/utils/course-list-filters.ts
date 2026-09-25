import type { OrgCourses } from '$features/course/types';
import {
  CourseSortBy,
  CourseSortOrder,
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

export const COURSE_LIST_FILTER_PARAM_KEYS = ['search', 'tags', 'sort', 'order', 'type', 'status'] as const;

export const DEFAULT_COURSE_LIST_FILTERS: CourseListFilters = {
  search: '',
  tags: [],
  sortKey: DEFAULT_COURSE_SORT,
  order: DEFAULT_SORT_ORDER,
  courseType: 'all',
  publishedStatus: 'all'
};

const VALID_COURSE_TYPES = new Set(['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE', 'PUBLIC']);

export function parsePublishedStatusFilter(value: string | null | undefined): PublishedStatusFilter {
  if (value === 'published' || value === 'unpublished') {
    return value;
  }

  return 'all';
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

export function buildCourseListSearchParams(filters: CourseListFilters): URLSearchParams {
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

  return params;
}

export function mergeCourseListSearchParams(current: URLSearchParams, filters: CourseListFilters): URLSearchParams {
  const next = new URLSearchParams(current);

  for (const key of COURSE_LIST_FILTER_PARAM_KEYS) {
    next.delete(key);
  }

  const built = buildCourseListSearchParams(filters);
  built.forEach((value, key) => {
    next.set(key, value);
  });

  return next;
}

export function courseListFiltersEqual(left: CourseListFilters, right: CourseListFilters): boolean {
  return (
    left.search === right.search &&
    left.sortKey === right.sortKey &&
    left.order === right.order &&
    left.courseType === right.courseType &&
    left.publishedStatus === right.publishedStatus &&
    left.tags.length === right.tags.length &&
    left.tags.every((tag, index) => tag === right.tags[index])
  );
}

export function filterAndSortOrgCourses(courses: OrgCourses, filters: CourseListFilters): OrgCourses {
  const normalizedSearch = filters.search.trim().toLowerCase();

  const filtered = courses.filter((course) => {
    if (normalizedSearch && !course.title.toLowerCase().includes(normalizedSearch)) {
      return false;
    }

    if (filters.courseType !== 'all' && course.type !== filters.courseType) {
      return false;
    }

    if (filters.publishedStatus === 'published' && !course.isPublished) {
      return false;
    }

    if (filters.publishedStatus === 'unpublished' && course.isPublished) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered];

  if (filters.sortKey === CourseSortBy.DateCreated) {
    return sorted.sort((left, right) =>
      filters.order === CourseSortOrder.Asc
        ? new Date(left.createdAt ?? '').getTime() - new Date(right.createdAt ?? '').getTime()
        : new Date(right.createdAt ?? '').getTime() - new Date(left.createdAt ?? '').getTime()
    );
  }

  if (filters.sortKey === CourseSortBy.LastUpdatedAt) {
    return sorted.sort((left, right) => {
      const leftUpdatedAt = new Date(left.updatedAt ?? left.createdAt ?? '').getTime();
      const rightUpdatedAt = new Date(right.updatedAt ?? right.createdAt ?? '').getTime();

      return filters.order === CourseSortOrder.Asc ? leftUpdatedAt - rightUpdatedAt : rightUpdatedAt - leftUpdatedAt;
    });
  }

  if (filters.sortKey === CourseSortBy.Published) {
    return sorted.sort((left, right) =>
      filters.order === CourseSortOrder.Asc
        ? Number(left.isPublished) - Number(right.isPublished)
        : Number(right.isPublished) - Number(left.isPublished)
    );
  }

  if (filters.sortKey === CourseSortBy.Lessons) {
    return sorted.sort((left, right) =>
      filters.order === CourseSortOrder.Asc
        ? left.lessonCount - right.lessonCount
        : right.lessonCount - left.lessonCount
    );
  }

  return sorted;
}
