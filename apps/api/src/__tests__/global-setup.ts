/**
 * Ensures reference rows that database-backed suites assume exist (roles,
 * submission statuses, question types). Fresh `drizzle-kit migrate`
 * databases - such as the one in CI - contain schema only, so without this
 * every fixture inserting a group member fails on the role foreign key.
 * Runs once per test run in the main process, before workers start, so the
 * database module is loaded after every test-file mock is registered.
 * Skipped entirely when no database is configured (those suites skip
 * themselves).
 */
export default async function globalSetup() {
  if (!process.env.DATABASE_URL && !process.env.PRIVATE_DATABASE_URL && !process.env.PGBOUNCER_DATABASE_URL) {
    return;
  }

  const { db, role } = await import('@cio/db/drizzle');
  const { eq } = await import('drizzle-orm');

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
    // A concurrent run may have seeded first; the rows exist now.
  }
}
