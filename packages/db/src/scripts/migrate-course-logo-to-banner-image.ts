import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

/**
 * One-time backfill for the course image move from `logo` to `bannerImage`.
 *
 * Every course that still only has a `logo` gets it copied onto `bannerImage`,
 * then `logo` is cleared so no stale duplicate remains. Safe to re-run: rows
 * that already have a `bannerImage` are skipped.
 */
async function migrateCourseLogoToBannerImage() {
  try {
    const result = await db.execute(sql`
      update course
      set banner_image = logo,
          logo = ''
      where (banner_image is null or banner_image = '')
        and logo is not null
        and logo <> ''
    `);

    console.log('Course logo → bannerImage migration completed', { result });
    process.exit(0);
  } catch (error) {
    console.error('Course logo → bannerImage migration failed', error);
    process.exit(1);
  }
}

migrateCourseLogoToBannerImage();
