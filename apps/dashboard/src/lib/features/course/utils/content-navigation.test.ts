import { describe, expect, it } from 'vitest';

import { isContentItemInPath, isSectionExpanded, updateSectionExpansionState } from './content-navigation';

describe('isContentItemInPath', () => {
  it('returns false when the current path is missing', () => {
    expect(isContentItemInPath('lesson-1', undefined)).toBe(false);
    expect(isContentItemInPath('lesson-1', null)).toBe(false);
    expect(isContentItemInPath('lesson-1', '')).toBe(false);
  });

  it('matches content ids as exact pathname segments', () => {
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-1')).toBe(true);
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-10')).toBe(false);
  });
});

describe('isSectionExpanded', () => {
  it('defaults to true for admins when collapsed set is empty', () => {
    const isExpanded = isSectionExpanded({
      sectionId: 'section-1',
      isStudent: false,
      expandedSectionIds: new Set(),
      collapsedSectionIds: new Set()
    });

    expect(isExpanded).toBe(true);
  });

  it('returns false for admins when section is in collapsed set', () => {
    const isExpanded = isSectionExpanded({
      sectionId: 'section-1',
      isStudent: false,
      expandedSectionIds: new Set(),
      collapsedSectionIds: new Set(['section-1'])
    });

    expect(isExpanded).toBe(false);
  });

  it('returns true for admins when another section is collapsed', () => {
    const isExpanded = isSectionExpanded({
      sectionId: 'section-2',
      isStudent: false,
      expandedSectionIds: new Set(),
      collapsedSectionIds: new Set(['section-1'])
    });

    expect(isExpanded).toBe(true);
  });

  it('defaults to false for students when expanded set is empty', () => {
    const isExpanded = isSectionExpanded({
      sectionId: 'section-1',
      isStudent: true,
      expandedSectionIds: new Set(),
      collapsedSectionIds: new Set()
    });

    expect(isExpanded).toBe(false);
  });

  it('returns true for students when section is in expanded set', () => {
    const isExpanded = isSectionExpanded({
      sectionId: 'section-1',
      isStudent: true,
      expandedSectionIds: new Set(['section-1']),
      collapsedSectionIds: new Set()
    });

    expect(isExpanded).toBe(true);
  });
});

describe('updateSectionExpansionState', () => {
  it('adds section to collapsed set when admin collapses it', () => {
    const collapsedSectionIds = new Set<string>();
    const expandedSectionIds = new Set<string>();

    updateSectionExpansionState({
      sectionId: 'section-1',
      open: false,
      isStudent: false,
      expandedSectionIds,
      collapsedSectionIds
    });

    expect(collapsedSectionIds.has('section-1')).toBe(true);
    expect(expandedSectionIds.size).toBe(0);
  });

  it('removes section from collapsed set when admin expands it', () => {
    const collapsedSectionIds = new Set<string>(['section-1', 'section-2']);
    const expandedSectionIds = new Set<string>();

    updateSectionExpansionState({
      sectionId: 'section-1',
      open: true,
      isStudent: false,
      expandedSectionIds,
      collapsedSectionIds
    });

    expect(collapsedSectionIds.has('section-1')).toBe(false);
    expect(collapsedSectionIds.has('section-2')).toBe(true);
  });

  it('adds section to expanded set when student expands it', () => {
    const collapsedSectionIds = new Set<string>();
    const expandedSectionIds = new Set<string>();

    updateSectionExpansionState({
      sectionId: 'section-1',
      open: true,
      isStudent: true,
      expandedSectionIds,
      collapsedSectionIds
    });

    expect(expandedSectionIds.has('section-1')).toBe(true);
    expect(collapsedSectionIds.size).toBe(0);
  });

  it('removes section from expanded set when student collapses it', () => {
    const collapsedSectionIds = new Set<string>();
    const expandedSectionIds = new Set<string>(['section-1', 'section-2']);

    updateSectionExpansionState({
      sectionId: 'section-1',
      open: false,
      isStudent: true,
      expandedSectionIds,
      collapsedSectionIds
    });

    expect(expandedSectionIds.has('section-1')).toBe(false);
    expect(expandedSectionIds.has('section-2')).toBe(true);
  });
});
