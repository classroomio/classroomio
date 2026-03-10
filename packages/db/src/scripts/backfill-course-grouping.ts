import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

async function backfillCourseGrouping() {
  try {
    const enableResult = await db.execute(sql`
      update course
      set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{isContentGroupingEnabled}', 'true'::jsonb, true)
      where version = 'V2'
    `);

    const disableResult = await db.execute(sql`
      update course
      set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{isContentGroupingEnabled}', 'false'::jsonb, true)
      where version = 'V1'
    `);

    console.log('Course grouping backfill completed', {
      enabled: enableResult,
      disabled: disableResult
    });
    process.exit(0);
  } catch (error) {
    console.error('Course grouping backfill failed', error);
    process.exit(1);
  }
}

backfillCourseGrouping();
