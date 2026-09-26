import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

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
