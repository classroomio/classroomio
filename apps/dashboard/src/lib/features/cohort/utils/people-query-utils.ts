import type {
  TCohortPeopleActivityWindow,
  TCohortPeopleMembership,
  TCohortPeopleSortBy,
  TCohortPeopleSortOrder
} from '@cio/utils/validation/cohort/people';
import type { CohortPeopleView, ListCohortPeopleQuery } from '$features/cohort/utils/types';

const SORT_BY_VALUES: ListCohortPeopleQuery['sortBy'][] = ['name', 'role', 'joined', 'lastLogin'];
const SORT_ORDER_VALUES: ListCohortPeopleQuery['sortOrder'][] = ['asc', 'desc'];
const MEMBERSHIP_VALUES: TCohortPeopleMembership[] = ['joined', 'invited'];
const ACTIVITY_WINDOW_VALUES: TCohortPeopleActivityWindow[] = ['7d', '30d', '90d', '180d', 'never'];

export const DEFAULT_COHORT_PEOPLE_QUERY: ListCohortPeopleQuery = {
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc'
};

const OWNED_PARAMS = [
  'page',
  'limit',
  'search',
  'roleId',
  'sortBy',
  'sortOrder',
  'membership',
  'lastLoginBefore'
] as const;

const readEnum = <T extends string>(value: string | null, allowed: T[]): T | undefined =>
  value && (allowed as string[]).includes(value) ? (value as T) : undefined;

export function getCohortPeopleQueryFromSearchParams(searchParams: URLSearchParams): ListCohortPeopleQuery {
  const page = Number(searchParams.get('page'));
  const limit = Number(searchParams.get('limit'));
  const roleId = Number(searchParams.get('roleId'));

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_COHORT_PEOPLE_QUERY.page,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.max(Math.floor(limit), 1), 100)
        : DEFAULT_COHORT_PEOPLE_QUERY.limit,
    search: searchParams.get('search')?.trim() || undefined,
    roleId: Number.isInteger(roleId) && roleId > 0 ? roleId : undefined,
    sortBy: readEnum(searchParams.get('sortBy'), SORT_BY_VALUES) ?? DEFAULT_COHORT_PEOPLE_QUERY.sortBy,
    sortOrder: readEnum(searchParams.get('sortOrder'), SORT_ORDER_VALUES) ?? DEFAULT_COHORT_PEOPLE_QUERY.sortOrder,
    membership: readEnum(searchParams.get('membership'), MEMBERSHIP_VALUES),
    lastLoginBefore: readEnum(searchParams.get('lastLoginBefore'), ACTIVITY_WINDOW_VALUES)
  };
}

/** Returns `query` with this page's params applied over the existing URL, so unrelated params survive. */
export function getCohortPeopleSearchParams(
  query: ListCohortPeopleQuery,
  current: URLSearchParams = new URLSearchParams()
): URLSearchParams {
  const searchParams = new URLSearchParams(current);

  for (const param of OWNED_PARAMS) {
    searchParams.delete(param);
  }

  if (query.page !== DEFAULT_COHORT_PEOPLE_QUERY.page) searchParams.set('page', String(query.page));
  if (query.limit !== DEFAULT_COHORT_PEOPLE_QUERY.limit) searchParams.set('limit', String(query.limit));
  if (query.sortBy !== DEFAULT_COHORT_PEOPLE_QUERY.sortBy) searchParams.set('sortBy', query.sortBy);
  if (query.sortOrder !== DEFAULT_COHORT_PEOPLE_QUERY.sortOrder) {
    searchParams.set('sortOrder', query.sortOrder);
  }
  if (query.search) searchParams.set('search', query.search);
  if (query.roleId !== undefined) searchParams.set('roleId', String(query.roleId));
  if (query.membership) searchParams.set('membership', query.membership);
  if (query.lastLoginBefore) searchParams.set('lastLoginBefore', query.lastLoginBefore);

  return searchParams;
}

const VIEW_FILTERS: Record<CohortPeopleView, Partial<ListCohortPeopleQuery>> = {
  all: {},
  tutors: { roleId: 2 },
  students: { roleId: 3 },
  pending_invites: { membership: 'invited' },
  never_logged_in: { lastLoginBefore: 'never' }
};

export const COHORT_PEOPLE_VIEWS = Object.keys(VIEW_FILTERS) as CohortPeopleView[];

const VIEW_MATCHED_KEYS = ['membership', 'lastLoginBefore', 'roleId'] as const;

export function applyCohortPeopleView(
  view: CohortPeopleView,
  current: ListCohortPeopleQuery = DEFAULT_COHORT_PEOPLE_QUERY
): ListCohortPeopleQuery {
  return {
    ...DEFAULT_COHORT_PEOPLE_QUERY,
    search: current.search,
    sortBy: current.sortBy,
    sortOrder: current.sortOrder,
    limit: current.limit,
    ...VIEW_FILTERS[view],
    page: 1
  };
}

export function matchCohortPeopleView(query: ListCohortPeopleQuery): CohortPeopleView | null {
  for (const view of COHORT_PEOPLE_VIEWS) {
    const candidate = applyCohortPeopleView(view, query);
    const matches = VIEW_MATCHED_KEYS.every((key) => candidate[key] === query[key]);

    if (matches) {
      return view;
    }
  }

  return null;
}

export function clearCohortPeopleFilters(query: ListCohortPeopleQuery): ListCohortPeopleQuery {
  return applyCohortPeopleView('all', query);
}

export function countActiveCohortPeopleFilters(query: ListCohortPeopleQuery): number {
  return VIEW_MATCHED_KEYS.filter((key) => query[key] !== undefined).length;
}
