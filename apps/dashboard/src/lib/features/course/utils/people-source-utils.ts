import { CoursePeopleSource, type TCoursePeopleSource } from '@cio/utils/validation/course';
import { toPeopleRequestQuery } from './people-utils';
import type { ListPeopleQueryWithSource, ListPeopleRequestQuery, PeopleSourceFilter } from './types';

/**
 * Source ("how did this member reach the course") filter for the course People roster.
 *
 * Kept in its own module so the URL-backed roster from classroomio/classroomio#1226 can
 * adopt it without conflicting with that PR's files. The backend half lives in
 * `packages/db/src/queries/course/people-source.ts` (with its own TODO).
 *
 * TODO(#1226): once the URL-backed roster merges:
 * 1. types.ts: add `source?: PeopleSourceFilter` to `ListPeopleQuery`, then replace
 *    `ListPeopleQueryWithSource` with `ListPeopleQuery` and delete it.
 * 2. people-utils.ts: forward `source: query.source` in `toPeopleRequestQuery`, point
 *    `peopleApi.list` back at it, and delete `toPeopleRequestQueryWithSource` below.
 * 3. people-query-utils.ts: add `PEOPLE_SOURCE_PARAM` to `OWNED_PARAMS`; read it in
 *    `getPeopleQueryFromSearchParams` with `readPeopleSourceParam`; write it in
 *    `getPeopleSearchParams` with `writePeopleSourceParam`; add `'source'` to
 *    `VIEW_MATCHED_KEYS` so the active-filter count and "Clear" include it.
 * 4. people-filter-popover.svelte: append `getPeopleSourceFilterGroup($t)` to `groups`.
 * 5. pages/people.svelte: take #1226's script, toolbar and header when resolving; delete
 *    `<PeopleSourceSelect>`, `sourceFilter` and `handleSourceChange`; add
 *    `{ label: $t('course.navItem.people.source') }` (no `sortKey`) after the learner
 *    column in `tableColumns`; keep `<PeopleSourceCell>` and `colspan={7}` in the body.
 *    Then delete `people-source-select.svelte`, `ALL_SOURCES_FILTER` and
 *    `toPeopleSourceFilter` if nothing else uses them.
 * 6. Review follow-ups on #1226's code, applied while resolving (course and cohort pages):
 *    - `refreshCurrentPage` and the delete path must call `loadMembers` directly; resetting
 *      `loadedQueryKey` does not rerun the effect, so the roster stays stale;
 *    - catch `goto` rejections in `navigatePeople` so a failed navigation cannot leave the
 *      controls out of sync with the URL;
 *    - clamp `limit` read from the URL to 1..100 (the endpoint rejects anything else).
 *    Confirm #1226 itself fixed: progress sort by percent (not bucket), the "Awaiting
 *    certificate" view (completed students only), and the stale cohort roster.
 * 7. Translations: resolve en.json keeping both key sets, run `pnpm translate`, and check
 *    `{}` placeholders survived.
 */

/** Query-string key shared by the URL and the members endpoint. */
export const PEOPLE_SOURCE_PARAM = 'source';

/** Select value that means "every source" and so sends no source to the API. */
export const ALL_SOURCES_FILTER = 'all';

const SOURCE_LABEL_KEYS: Record<TCoursePeopleSource, string> = {
  direct: 'course.navItem.people.source_filter_direct',
  learning_path: 'course.navItem.people.source_learning_path',
  cohort: 'course.navItem.people.source_cohort'
};

/** Maps a select or URL value to the API filter; `all`, empty or unknown values send none. */
export function toPeopleSourceFilter(value: string | null | undefined): PeopleSourceFilter | undefined {
  return CoursePeopleSource.safeParse(value).data;
}

/**
 * Reads the source filter from the URL (`?source=`), returning undefined for
 * `all`, empty or hand-edited invalid values.
 */
export function readPeopleSourceParam(searchParams: URLSearchParams): PeopleSourceFilter | undefined {
  return toPeopleSourceFilter(searchParams.get(PEOPLE_SOURCE_PARAM));
}

/** Sets or clears the source param in place, leaving every other param untouched. */
export function writePeopleSourceParam(searchParams: URLSearchParams, source: PeopleSourceFilter | undefined): void {
  if (source) {
    searchParams.set(PEOPLE_SOURCE_PARAM, source);
    return;
  }

  searchParams.delete(PEOPLE_SOURCE_PARAM);
}

/** `toPeopleRequestQuery` plus the source filter, which the base helper does not know about yet. */
export function toPeopleRequestQueryWithSource(query: ListPeopleQueryWithSource): ListPeopleRequestQuery {
  const { source, ...baseQuery } = query;
  const requestQuery = toPeopleRequestQuery(baseQuery);

  return { ...requestQuery, source };
}

/**
 * The source filter as a `{ label, options: [{ label, patch }] }` group, the shape the roster
 * filter popover renders. There is no "all" option: toggling the selected option off clears it.
 */
export function getPeopleSourceFilterGroup(translate: (key: string) => string) {
  const options = CoursePeopleSource.options.map((source) => ({
    label: translate(SOURCE_LABEL_KEYS[source]),
    patch: { source }
  }));

  return { label: translate('course.navItem.people.source'), options };
}
