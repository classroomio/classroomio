import { describe, expect, it } from 'vitest';
import {
  ALL_SOURCES_FILTER,
  PEOPLE_SOURCE_PARAM,
  getPeopleSourceFilterGroup,
  readPeopleSourceParam,
  toPeopleRequestQueryWithSource,
  toPeopleSourceFilter,
  writePeopleSourceParam
} from './people-source-utils';

describe('toPeopleSourceFilter', () => {
  it('passes through every API source', () => {
    expect(toPeopleSourceFilter('direct')).toBe('direct');
    expect(toPeopleSourceFilter('learning_path')).toBe('learning_path');
    expect(toPeopleSourceFilter('cohort')).toBe('cohort');
  });

  it('sends no filter for "all", empty or unknown values', () => {
    expect(toPeopleSourceFilter(ALL_SOURCES_FILTER)).toBeUndefined();
    expect(toPeopleSourceFilter('')).toBeUndefined();
    expect(toPeopleSourceFilter(null)).toBeUndefined();
    expect(toPeopleSourceFilter('LEARNING_PATH')).toBeUndefined();
  });
});

describe('readPeopleSourceParam', () => {
  it('reads a valid source from the URL', () => {
    expect(readPeopleSourceParam(new URLSearchParams('source=cohort'))).toBe('cohort');
  });

  it('ignores a hand-edited invalid source', () => {
    expect(readPeopleSourceParam(new URLSearchParams('source=bogus'))).toBeUndefined();
  });
});

describe('writePeopleSourceParam', () => {
  it('sets the source and keeps unrelated params', () => {
    const searchParams = new URLSearchParams('page=2&add=true');
    writePeopleSourceParam(searchParams, 'learning_path');

    expect(searchParams.get(PEOPLE_SOURCE_PARAM)).toBe('learning_path');
    expect(searchParams.get('page')).toBe('2');
    expect(searchParams.get('add')).toBe('true');
  });

  it('removes the param when the source is cleared', () => {
    const searchParams = new URLSearchParams('source=cohort&page=2');
    writePeopleSourceParam(searchParams, undefined);

    expect(searchParams.has(PEOPLE_SOURCE_PARAM)).toBe(false);
    expect(searchParams.get('page')).toBe('2');
  });

  it('round-trips through readPeopleSourceParam', () => {
    const searchParams = new URLSearchParams();
    writePeopleSourceParam(searchParams, 'direct');

    expect(readPeopleSourceParam(searchParams)).toBe('direct');
  });
});

describe('toPeopleRequestQueryWithSource', () => {
  it('stringifies the base query and forwards the source', () => {
    const requestQuery = toPeopleRequestQueryWithSource({ page: 2, limit: 20, roleId: 3, source: 'cohort' });

    expect(requestQuery).toEqual({ page: '2', limit: '20', search: undefined, roleId: '3', source: 'cohort' });
  });

  it('omits the source value when no source filter is set', () => {
    const requestQuery = toPeopleRequestQueryWithSource({ page: 1, limit: 20 });

    expect(requestQuery.source).toBeUndefined();
    expect(requestQuery.page).toBe('1');
  });
});

describe('getPeopleSourceFilterGroup', () => {
  const translate = (key: string) => `t:${key}`;

  it('labels the group and offers one option per source, without an "all" option', () => {
    const group = getPeopleSourceFilterGroup(translate);

    expect(group.label).toBe('t:course.navItem.people.source');
    expect(group.options.map((option) => option.patch)).toEqual([
      { source: 'direct' },
      { source: 'learning_path' },
      { source: 'cohort' }
    ]);
    expect(group.options[1].label).toBe('t:course.navItem.people.source_learning_path');
  });
});
