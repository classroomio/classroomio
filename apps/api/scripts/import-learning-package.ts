/**
 * Evaluation tool for the course builder (item 11): imports every course of a learning package into one organisation of
 * a local database, through the same publisher the course-build worker uses (`publishPackageCourse`).
 * Run from apps/api: pnpm tsx scripts/import-learning-package.ts --file=<package.json> --org=<siteName> --email=<admin>
 */
import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { LearningPackage } from '@cio/core/services/course-builder/export';
import { publishPackageCourse } from '@cio/core/services/course-builder/publish';
import { db, eq, organization, profile } from '@db/drizzle';

const option = (name: string) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

async function main() {
  const file = option('file');
  const siteName = option('org');
  const email = option('email');
  if (!file || !siteName || !email) throw new Error('--file, --org and --email are required');

  const pkg = JSON.parse(readFileSync(file, 'utf8')) as LearningPackage;
  const [org] = await db.select().from(organization).where(eq(organization.siteName, siteName));
  const [author] = await db.select().from(profile).where(eq(profile.email, email));
  if (!org || !author) throw new Error(`No organisation "${siteName}" or no profile "${email}"`);

  for (const course of pkg.courses) {
    const published = await publishPackageCourse({
      organizationId: org.id,
      profileId: author.id,
      pkg,
      courseKey: course.key,
      idempotencyKey: `learning-package-import:${randomUUID()}`
    });
    console.log(JSON.stringify({ title: course.title, ...published }));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
