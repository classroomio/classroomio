import { describe, expect, it } from 'vitest';
import { formatPluginPermission, groupPluginPermissions, summarizePluginPermissions } from './permissions';

describe('formatPluginPermission', () => {
  it('formats known permission scopes into friendly titles and descriptions', () => {
    const formatted = formatPluginPermission('lesson.metadata:read');
    expect(formatted.name).toBe('Read Lesson Info');
    expect(formatted.category).toBe('lessons');
    expect(formatted.isSensitive).toBe(false);
  });

  it('marks sensitive permissions correctly', () => {
    const formatted = formatPluginPermission('course.metadata:write');
    expect(formatted.name).toBe('Manage Courses');
    expect(formatted.isSensitive).toBe(true);
  });

  it('handles colon-based raw scope strings like lesson:read or lesson:metadata:read', () => {
    const formattedRead = formatPluginPermission('lesson:read');
    expect(formattedRead.category).toBe('lessons');
    expect(formattedRead.name).toBe('Read Lesson Info');

    const formattedMeta = formatPluginPermission('lesson:metadata:read');
    expect(formattedMeta.category).toBe('lessons');
    expect(formattedMeta.name).toBe('Read Lesson Info');
  });

  it('gracefully humanizes unknown scope strings', () => {
    const formatted = formatPluginPermission('analytics.custom_metric:read');
    expect(formatted.name).toBe('View Analytics');
    expect(formatted.category).toBe('other');
  });
});

describe('groupPluginPermissions', () => {
  it('groups multiple permissions by their category', () => {
    const permissions = ['lesson.metadata:read', 'learner.progress:read', 'course.metadata:read'];
    const groups = groupPluginPermissions(permissions);

    const categories = groups.map((g) => g.category);
    expect(categories).toContain('courses');
    expect(categories).toContain('lessons');
    expect(categories).toContain('progress');
  });
});

describe('summarizePluginPermissions', () => {
  it('summarizes permissions into clean category pills for gallery cards', () => {
    const permissions = ['lesson.metadata:read', 'course.metadata:read'];
    const summary = summarizePluginPermissions(permissions);

    expect(summary.length).toBe(2);
    expect(summary.map((s) => s.categoryLabel)).toEqual(['Courses', 'Lessons']);
  });

  it('returns empty array when no permissions are requested', () => {
    expect(summarizePluginPermissions([])).toEqual([]);
    expect(summarizePluginPermissions(undefined)).toEqual([]);
  });
});
