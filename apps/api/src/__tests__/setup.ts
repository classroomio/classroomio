import { db, role } from '@cio/db/drizzle';
import { eq } from 'drizzle-orm';

/**
 * Ensures reference rows that database-backed suites assume exist (roles,
 * submission statuses, question types). Fresh `drizzle-kit migrate`
 * databases - such as the one in CI - contain schema only, so without this
 * every fixture inserting a group member fails on the role foreign key.
 * Each seed helper is idempotent; the outer try/catch absorbs races when
 * parallel workers seed the same fresh database at once. Skipped entirely
 * when no database is configured (those suites skip themselves).
 */
async function ensureReferenceData() {
  if (!process.env.DATABASE_URL && !process.env.PRIVATE_DATABASE_URL && !process.env.PGBOUNCER_DATABASE_URL) {
    return;
  }

  try {
    const existing = await db.select({ id: role.id }).from(role).where(eq(role.id, 1)).limit(1);
    if (existing.length > 0) return;

    const { seedRoles } = await import('@cio/db/utils/seed/role');
    const { seedSubmissions } = await import('@cio/db/utils/seed/submission');
    const { seedQuestionTypes } = await import('@cio/db/utils/seed/questionType');
    await seedRoles();
    await seedSubmissions();
    await seedQuestionTypes();
  } catch {
    // Another parallel worker seeded first; the rows exist now.
  }
}

await ensureReferenceData();
