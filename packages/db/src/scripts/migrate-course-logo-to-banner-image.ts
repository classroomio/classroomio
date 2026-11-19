import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

/**
 * Copies the deprecated `course.logo` into `banner_image` for rows written
 * before `bannerImage` became the canonical course image.
 *
 * Reports the affected row count and exits without writing unless `--execute`
 * is passed, so an operator can size the change before committing to it.
 */
const PENDING_ROWS = sql`
  from course
  where (banner_image is null or banner_image = '')
    and logo is not null
    and logo <> ''
`;

async function migrateCourseLogoToBannerImage() {
  const shouldExecute = process.argv.includes('--execute');

  try {
    const [pending] = await db.execute(sql`select count(*)::int as count ${PENDING_ROWS}`);
    const pendingCount = Number((pending as { count: number } | undefined)?.count ?? 0);

    if (!shouldExecute) {
      console.log('Course logo → bannerImage migration (dry run)', {
        rowsThatWouldChange: pendingCount,
        hint: 'Re-run with --execute to apply.'
      });
      process.exit(0);
    }

    if (pendingCount === 0) {
      console.log('Course logo → bannerImage migration: nothing to do');
      process.exit(0);
    }

    const result = await db.execute(sql`
      update course
      set banner_image = logo
      where (banner_image is null or banner_image = '')
        and logo is not null
        and logo <> ''
    `);

    console.log('Course logo → bannerImage migration completed', {
      rowsExpected: pendingCount,
      rowsUpdated: result.count ?? 0
    });
    process.exit(0);
  } catch (error) {
    console.error('Course logo → bannerImage migration failed', error);
    process.exit(1);
  }
}

migrateCourseLogoToBannerImage();
