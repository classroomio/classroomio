import type {
  OrganizationAudienceActivityWindow,
  OrganizationAudienceCompletion,
  OrganizationAudienceEnrollment,
  OrganizationAudienceInviteStatus,
  OrganizationAudienceMemberStatus,
  OrganizationAudienceQuery,
  OrganizationAudienceRequestQuery,
  OrganizationAudienceSortBy,
  OrganizationAudienceSortOrder,
  OrganizationAudienceView
} from './types';

export const DEFAULT_ORG_AUDIENCE_QUERY: OrganizationAudienceQuery = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  status: 'ACTIVE',
  excludeRecentJoiners: true
};

const SORT_BY_VALUES: OrganizationAudienceSortBy[] = ['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt'];
const SORT_ORDER_VALUES: OrganizationAudienceSortOrder[] = ['asc', 'desc'];
const MEMBER_STATUS_VALUES: OrganizationAudienceMemberStatus[] = ['ACTIVE', 'DEACTIVATED', 'ARCHIVED'];
const INVITE_STATUS_VALUES: OrganizationAudienceInviteStatus[] = ['active', 'pending', 'expired', 'revoked'];
const ENROLLMENT_VALUES: OrganizationAudienceEnrollment[] = ['enrolled', 'not_enrolled'];
const COMPLETION_VALUES: OrganizationAudienceCompletion[] = ['not_started', 'in_progress', 'completed'];
const ACTIVITY_WINDOW_VALUES: OrganizationAudienceActivityWindow[] = ['7d', '30d', '90d', '180d', 'never'];

/** Unknown values fall back to the default, so a truncated link still loads. */
function readEnum<T extends string>(value: string | null, allowed: T[]): T | undefined {
  return value && (allowed as string[]).includes(value) ? (value as T) : undefined;
}

export function getAudienceQueryFromSearchParams(
  searchParams: URLSearchParams,
  defaults: OrganizationAudienceQuery = DEFAULT_ORG_AUDIENCE_QUERY
): OrganizationAudienceQuery {
  const page = Number(searchParams.get('page'));
  const limit = Number(searchParams.get('limit'));
  const search = searchParams.get('search')?.trim() || undefined;
  const excludeRecentJoiners = searchParams.get('excludeRecentJoiners');

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : defaults.page,
    limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : defaults.limit,
    sortBy: readEnum(searchParams.get('sortBy'), SORT_BY_VALUES) ?? defaults.sortBy,
    sortOrder: readEnum(searchParams.get('sortOrder'), SORT_ORDER_VALUES) ?? defaults.sortOrder,
    status: readEnum(searchParams.get('status'), MEMBER_STATUS_VALUES) ?? defaults.status,
    inviteStatus: readEnum(searchParams.get('inviteStatus'), INVITE_STATUS_VALUES),
    enrollment: readEnum(searchParams.get('enrollment'), ENROLLMENT_VALUES),
    completion: readEnum(searchParams.get('completion'), COMPLETION_VALUES),
    lastLoginBefore: readEnum(searchParams.get('lastLoginBefore'), ACTIVITY_WINDOW_VALUES),
    lastActiveBefore: readEnum(searchParams.get('lastActiveBefore'), ACTIVITY_WINDOW_VALUES),
    // Only an explicit "false" turns the guard off.
    excludeRecentJoiners:
      excludeRecentJoiners === null ? defaults.excludeRecentJoiners : excludeRecentJoiners !== 'false',
    search
  };
}

/** Omits defaults, so a plain `/audience` stays clean. */
export function getAudienceSearchParams(
  query: OrganizationAudienceQuery,
  defaults: OrganizationAudienceQuery = DEFAULT_ORG_AUDIENCE_QUERY
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (query.page !== defaults.page) searchParams.set('page', String(query.page));
  if (query.limit !== defaults.limit) searchParams.set('limit', String(query.limit));
  if (query.sortBy !== defaults.sortBy) searchParams.set('sortBy', query.sortBy);
  if (query.sortOrder !== defaults.sortOrder) searchParams.set('sortOrder', query.sortOrder);
  if (query.status !== defaults.status) searchParams.set('status', query.status);
  if (query.inviteStatus) searchParams.set('inviteStatus', query.inviteStatus);
  if (query.enrollment) searchParams.set('enrollment', query.enrollment);
  if (query.completion) searchParams.set('completion', query.completion);
  if (query.lastLoginBefore) searchParams.set('lastLoginBefore', query.lastLoginBefore);
  if (query.lastActiveBefore) searchParams.set('lastActiveBefore', query.lastActiveBefore);
  if (query.excludeRecentJoiners !== defaults.excludeRecentJoiners) {
    searchParams.set('excludeRecentJoiners', String(query.excludeRecentJoiners));
  }
  if (query.search) searchParams.set('search', query.search);

  return searchParams;
}

export function toAudienceRequestQuery(
  query?: Partial<OrganizationAudienceQuery>
): OrganizationAudienceRequestQuery | undefined {
  if (!query) {
    return undefined;
  }

  return {
    page: query.page != null ? String(query.page) : undefined,
    limit: query.limit != null ? String(query.limit) : undefined,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    status: query.status,
    inviteStatus: query.inviteStatus,
    enrollment: query.enrollment,
    completion: query.completion,
    lastLoginBefore: query.lastLoginBefore,
    lastActiveBefore: query.lastActiveBefore,
    excludeRecentJoiners: query.excludeRecentJoiners != null ? String(query.excludeRecentJoiners) : undefined
  } as OrganizationAudienceRequestQuery;
}

/**
 * The filter half of a query, for the preview and bulk-action endpoints. Sort
 * and pagination are dropped — they change what is shown, not what matches.
 */
export function toAudienceBulkFilterQuery(query: OrganizationAudienceQuery) {
  return {
    status: query.status,
    inviteStatus: query.inviteStatus,
    enrollment: query.enrollment,
    completion: query.completion,
    lastLoginBefore: query.lastLoginBefore,
    lastActiveBefore: query.lastActiveBefore,
    excludeRecentJoiners: String(query.excludeRecentJoiners),
    search: query.search
  };
}

/** Views are a presentation of filters, never a parallel state. */
const VIEW_FILTERS: Record<OrganizationAudienceView, Partial<OrganizationAudienceQuery>> = {
  all: {},
  never_logged_in: { lastLoginBefore: 'never' },
  inactive_90d: { lastActiveBefore: '90d' },
  inactive_180d: { lastActiveBefore: '180d' },
  enrolled_not_started: { enrollment: 'enrolled', completion: 'not_started' },
  archived: { status: 'ARCHIVED' }
};

export const ORG_AUDIENCE_VIEWS = Object.keys(VIEW_FILTERS) as OrganizationAudienceView[];

/** Builds a view's query, resetting pagination as any filter change must. */
export function applyAudienceView(
  view: OrganizationAudienceView,
  current: OrganizationAudienceQuery = DEFAULT_ORG_AUDIENCE_QUERY
): OrganizationAudienceQuery {
  return {
    ...DEFAULT_ORG_AUDIENCE_QUERY,
    // Search and sort belong to the admin, not the view.
    search: current.search,
    sortBy: current.sortBy,
    sortOrder: current.sortOrder,
    limit: current.limit,
    ...VIEW_FILTERS[view],
    page: 1
  };
}

/**
 * The view a query represents, or `null` for a custom combination. Derived
 * rather than stored, so a hand-edited URL still labels correctly.
 */
export function matchAudienceView(query: OrganizationAudienceQuery): OrganizationAudienceView | null {
  for (const view of ORG_AUDIENCE_VIEWS) {
    const candidate = applyAudienceView(view, query);

    const matches =
      candidate.status === query.status &&
      candidate.inviteStatus === query.inviteStatus &&
      candidate.enrollment === query.enrollment &&
      candidate.completion === query.completion &&
      candidate.lastLoginBefore === query.lastLoginBefore &&
      candidate.lastActiveBefore === query.lastActiveBefore;

    if (matches) {
      return view;
    }
  }

  return null;
}

/** Filters active beyond the defaults. Drives the filter button's dot. */
export function countActiveAudienceFilters(query: OrganizationAudienceQuery): number {
  let active = 0;

  if (query.status !== DEFAULT_ORG_AUDIENCE_QUERY.status) active += 1;
  if (query.inviteStatus) active += 1;
  if (query.enrollment) active += 1;
  if (query.completion) active += 1;
  if (query.lastLoginBefore) active += 1;
  if (query.lastActiveBefore) active += 1;

  return active;
}

/** Clears every filter while keeping search, sort and page size. */
export function clearAudienceFilters(query: OrganizationAudienceQuery): OrganizationAudienceQuery {
  return applyAudienceView('all', query);
}
