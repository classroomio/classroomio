import {
  type TCoursePeopleActivityWindow,
  type TCoursePeopleEnrolledWindow,
  type TCoursePeopleMembership,
  type TCoursePeopleProgress,
  type TCoursePeopleSortBy,
  type TCoursePeopleSortOrder
} from '@cio/utils/validation/course/people';
import { ROLE } from '@cio/utils/constants';
import type { CoursePeopleView, ListPeopleQuery } from '$features/course/utils/types';

const SORT_BY_VALUES: ListPeopleQuery['sortBy'][] = [
  'name',
  'role',
  'progress',
  'lastLogin',
  'enrolledAt',
  'certificate'
];
const SORT_ORDER_VALUES: ListPeopleQuery['sortOrder'][] = ['asc', 'desc'];
const PROGRESS_VALUES: TCoursePeopleProgress[] = ['not_started', 'in_progress', 'completed'];
const MEMBERSHIP_VALUES: TCoursePeopleMembership[] = ['joined', 'invited'];
const ENROLLED_WINDOW_VALUES: TCoursePeopleEnrolledWindow[] = ['7d', '30d', '90d', '180d'];
const ACTIVITY_WINDOW_VALUES: TCoursePeopleActivityWindow[] = ['7d', '30d', '90d', '180d', 'never'];

export const DEFAULT_PEOPLE_QUERY: ListPeopleQuery = {
  page: 1,
  limit: 20,
  sortBy: 'role',
  sortOrder: 'asc'
};

/** Params this page owns; anything else on the URL belongs to a different feature. */
const OWNED_PARAMS = [
  'page',
  'limit',
  'search',
  'roleId',
  'sortBy',
  'sortOrder',
  'progress',
  'membership',
  'enrolledWithin',
  'lastLoginBefore',
  'certificateEarned'
] as const;

const readEnum = <T extends string>(value: string | null, allowed: T[]): T | undefined =>
  value && (allowed as string[]).includes(value) ? (value as T) : undefined;

export function getPeopleQueryFromSearchParams(searchParams: URLSearchParams): ListPeopleQuery {
  const page = Number(searchParams.get('page'));
  const limit = Number(searchParams.get('limit'));
  const roleId = Number(searchParams.get('roleId'));
  const certificateEarned = searchParams.get('certificateEarned');

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PEOPLE_QUERY.page,
    limit:
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.max(Math.floor(limit), 1), 100) : DEFAULT_PEOPLE_QUERY.limit,
    search: searchParams.get('search')?.trim() || undefined,
    roleId: Number.isInteger(roleId) && roleId > 0 ? roleId : undefined,
    sortBy: readEnum(searchParams.get('sortBy'), SORT_BY_VALUES) ?? DEFAULT_PEOPLE_QUERY.sortBy,
    sortOrder: readEnum(searchParams.get('sortOrder'), SORT_ORDER_VALUES) ?? DEFAULT_PEOPLE_QUERY.sortOrder,
    progress: readEnum(searchParams.get('progress'), PROGRESS_VALUES),
    membership: readEnum(searchParams.get('membership'), MEMBERSHIP_VALUES),
    enrolledWithin: readEnum(searchParams.get('enrolledWithin'), ENROLLED_WINDOW_VALUES),
    lastLoginBefore: readEnum(searchParams.get('lastLoginBefore'), ACTIVITY_WINDOW_VALUES),
    certificateEarned: certificateEarned === 'true' ? true : certificateEarned === 'false' ? false : undefined
  };
}

/**
 * Merges this page's params over the existing URL so unrelated params survive.
 */
export function getPeopleSearchParams(
  query: ListPeopleQuery,
  current: URLSearchParams = new URLSearchParams()
): URLSearchParams {
  const searchParams = new URLSearchParams(current);

  for (const param of OWNED_PARAMS) {
    searchParams.delete(param);
  }

  if (query.page !== DEFAULT_PEOPLE_QUERY.page) searchParams.set('page', String(query.page));
  if (query.limit !== DEFAULT_PEOPLE_QUERY.limit) searchParams.set('limit', String(query.limit));
  if (query.sortBy !== DEFAULT_PEOPLE_QUERY.sortBy) searchParams.set('sortBy', query.sortBy);
  if (query.sortOrder !== DEFAULT_PEOPLE_QUERY.sortOrder) searchParams.set('sortOrder', query.sortOrder);
  if (query.search) searchParams.set('search', query.search);
  if (query.roleId !== undefined) searchParams.set('roleId', String(query.roleId));
  if (query.progress) searchParams.set('progress', query.progress);
  if (query.membership) searchParams.set('membership', query.membership);
  if (query.enrolledWithin) searchParams.set('enrolledWithin', query.enrolledWithin);
  if (query.lastLoginBefore) searchParams.set('lastLoginBefore', query.lastLoginBefore);
  if (query.certificateEarned !== undefined) searchParams.set('certificateEarned', String(query.certificateEarned));

  return searchParams;
}

const VIEW_FILTERS: Record<CoursePeopleView, Partial<ListPeopleQuery>> = {
  all: {},
  not_started: { progress: 'not_started' },
  in_progress: { progress: 'in_progress' },
  completed: { progress: 'completed' },
  never_logged_in: { lastLoginBefore: 'never' },
  awaiting_certificate: { certificateEarned: false, roleId: 3 }
};

export const COURSE_PEOPLE_VIEWS = Object.keys(VIEW_FILTERS) as CoursePeopleView[];

const VIEW_MATCHED_KEYS = [
  'progress',
  'membership',
  'enrolledWithin',
  'lastLoginBefore',
  'certificateEarned',
  'roleId'
] as const;

export function applyPeopleView(
  view: CoursePeopleView,
  current: ListPeopleQuery = DEFAULT_PEOPLE_QUERY
): ListPeopleQuery {
  return {
    ...DEFAULT_PEOPLE_QUERY,
    search: current.search,
    sortBy: current.sortBy,
    sortOrder: current.sortOrder,
    limit: current.limit,
    ...VIEW_FILTERS[view],
    page: 1
  };
}

/** Derived rather than stored, so a hand-edited URL still labels correctly. */
export function matchPeopleView(query: ListPeopleQuery): CoursePeopleView | null {
  for (const view of COURSE_PEOPLE_VIEWS) {
    const candidate = applyPeopleView(view, query);
    const matches = VIEW_MATCHED_KEYS.every((key) => candidate[key] === query[key]);

    if (matches) {
      return view;
    }
  }

  return null;
}

export function clearPeopleFilters(query: ListPeopleQuery): ListPeopleQuery {
  return applyPeopleView('all', query);
}

export function countActivePeopleFilters(query: ListPeopleQuery): number {
  return VIEW_MATCHED_KEYS.filter((key) => query[key] !== undefined).length;
}
