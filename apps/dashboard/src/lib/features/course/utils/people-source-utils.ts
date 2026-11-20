import { CoursePeopleSource, type TCoursePeopleSource } from '@cio/utils/validation/course';
import type { PeopleSourceFilter } from './types';

/** Query-string key shared by the URL and the members endpoint. */
export const PEOPLE_SOURCE_PARAM = 'source';

const SOURCE_LABEL_KEYS: Record<TCoursePeopleSource, string> = {
  direct: 'course.navItem.people.source_filter_direct',
  learning_path: 'course.navItem.people.source_learning_path',
  cohort: 'course.navItem.people.source_cohort'
};

/** Maps a URL value to the API filter; `all`, empty or unknown values send none. */
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
