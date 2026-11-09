import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';

import { getCourseContentItems } from '@cio/db/queries/course/content';

async function buildQuerySql(options?: { includeNoteContent?: boolean }) {
  const execute = vi.fn().mockResolvedValue([]);

  await getCourseContentItems('course-1', undefined, { execute } as never, options);

  return new PgDialect().sqlToQuery(execute.mock.calls[0][0]).sql;
}

describe('getCourseContentItems note content', () => {
  it('does not scan lesson note HTML by default', async () => {
    const sql = await buildQuerySql();

    expect(sql).not.toContain('regexp_replace');
    expect(sql).not.toContain('block_locale');
  });

  it('scans lesson note HTML when includeNoteContent is set', async () => {
    const sql = await buildQuerySql({ includeNoteContent: true });

    expect(sql).toContain('regexp_replace');
    expect(sql).toContain('block_locale');
  });
});
