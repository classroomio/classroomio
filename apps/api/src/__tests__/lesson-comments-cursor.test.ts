import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queries } = vi.hoisted(() => ({ queries: { rows: [] as unknown[][], wheres: [] as unknown[] } }));

vi.mock('@cio/db/drizzle', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/drizzle')>();

  const select = () => {
    const rows = queries.rows.shift() ?? [];
    const chain: Record<string, unknown> = {
      then: (resolve: (value: unknown[]) => unknown) => resolve(rows)
    };
    for (const method of ['from', 'leftJoin', 'orderBy', 'limit']) {
      chain[method] = () => chain;
    }
    chain.where = (condition: unknown) => {
      queries.wheres.push(condition);
      return chain;
    };
    return chain;
  };

  return { ...original, db: { select } };
});

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { getLessonCommentsByLessonIdPaginated } from '@cio/db/queries/lesson/lesson';

const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const row = (id: number, createdAt: string) => ({
  comment: { id, createdAt, lessonId: LESSON_ID },
  groupmember: null,
  profile: null
});

async function listComments(cursor?: string) {
  queries.rows = [[{ count: 3 }], [row(2, '2026-09-30 10:00:00.5+00'), row(9, '2026-09-30 09:00:00.123456+00')]];
  const page = await getLessonCommentsByLessonIdPaginated(LESSON_ID, { cursor, limit: 1 });
  const where = new PgDialect().sqlToQuery(queries.wheres[1] as SQL);

  return { page, where };
}

describe('getLessonCommentsByLessonIdPaginated cursor', () => {
  beforeEach(() => {
    queries.wheres = [];
  });

  it('hands out the last comment timestamp and id as the next cursor', async () => {
    const { page, where } = await listComments();

    expect(page.items.map((item) => item.id)).toEqual([2]);
    expect(page.nextCursor).toBe('2026-09-30 10:00:00.5+00|2');
    expect(where.params).toEqual([LESSON_ID]);
  });

  it('seeks past the cursor on both sort fields', async () => {
    const { where } = await listComments('2026-09-30 10:00:00.5+00|2');

    expect(where.sql).toContain(
      '("lesson_comment"."created_at", "lesson_comment"."id") < ($2::timestamptz, $3::bigint)'
    );
    expect(where.params).toEqual([LESSON_ID, '2026-09-30 10:00:00.5+00', 2]);
  });

  it('still accepts the id-only cursor a dashboard loaded before the change', async () => {
    const { where } = await listComments('7');

    expect(where.sql).toContain('"lesson_comment"."id" < $2');
    expect(where.params).toEqual([LESSON_ID, 7]);
  });

  it('restarts at the newest page for a malformed cursor', async () => {
    const { where } = await listComments('garbage|7');

    expect(where.params).toEqual([LESSON_ID]);
  });
});
