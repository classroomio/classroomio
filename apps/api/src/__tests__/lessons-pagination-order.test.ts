import { describe, expect, it, vi } from 'vitest';

const { queries } = vi.hoisted(() => ({ queries: { orderBys: [] as unknown[][], joins: [] as unknown[] } }));

vi.mock('@cio/db/drizzle', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/drizzle')>();

  const select = (fields?: Record<string, unknown>) => {
    const rows = fields && 'total' in fields ? [{ total: 2 }] : [{ lesson: { id: 'a' } }, { lesson: { id: 'b' } }];
    const chain: Record<string, unknown> = {
      then: (resolve: (value: unknown[]) => unknown) => resolve(rows)
    };
    for (const method of ['from', 'where', 'limit', 'offset']) {
      chain[method] = () => chain;
    }
    chain.leftJoin = (_table: unknown, on: unknown) => {
      queries.joins.push(on);
      return chain;
    };
    chain.orderBy = (...columns: unknown[]) => {
      queries.orderBys.push(columns);
      return chain;
    };
    return chain;
  };

  return { ...original, db: { select } };
});

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { getPaginatedLessonsByCourseId } from '@cio/db/queries/lesson/lesson';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

describe('getPaginatedLessonsByCourseId', () => {
  it('sorts by section order before lesson order and returns plain lessons', async () => {
    const page = await getPaginatedLessonsByCourseId(COURSE_ID, { page: 1, limit: 20 });
    const dialect = new PgDialect();

    expect(page).toEqual({ items: [{ id: 'a' }, { id: 'b' }], total: 2 });
    expect(dialect.sqlToQuery(queries.joins[0] as SQL).sql).toBe('"course_section"."id" = "lesson"."section_id"');
    expect(queries.orderBys[0].map((column) => dialect.sqlToQuery(column as SQL).sql)).toEqual([
      '"course_section"."order" asc',
      '"lesson"."section_id" asc',
      '"lesson"."order" asc',
      '"lesson"."id" asc'
    ]);
  });
});
