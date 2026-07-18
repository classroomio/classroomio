/**
 * One-time (manual, not cron) backfill: email admins of every free-plan org
 * that already exceeds the student limit, so they know new enrolments/invites
 * are now blocked. Dry-run by default; pass --execute to actually send.
 *
 * Usage:
 *   pnpm db:notify-students-over-limit             # dry run (default)
 *   pnpm db:notify-students-over-limit -- --execute # send emails
 */
import 'dotenv/config';

import { sendEmail } from '@cio/email';
import { PLAN, getStudentLimit } from '@cio/utils/plans';

import {
  getFreePlanOrganizationsOverStudentLimit,
  getOrganizationAdminEmails,
  updateOrganization
} from '../queries/organization/organization';

async function main() {
  const execute = process.argv.includes('--execute');
  const limit = getStudentLimit(PLAN.BASIC);
  const orgs = await getFreePlanOrganizationsOverStudentLimit(limit);

  let orgsToNotify = 0;
  let adminsToNotify = 0;
  let orgsOverWithoutAdmins = 0;
  let alreadyNotified = 0;

  for (const org of orgs) {
    // Skip orgs already emailed the "reached" milestone (runtime or a prior run).
    if (org.settings?.studentLimitNotified?.reached) {
      alreadyNotified++;
      continue;
    }

    const admins = await getOrganizationAdminEmails(org.id);
    if (!admins.length) {
      orgsOverWithoutAdmins++;
      console.log(`Skipping ${org.name} (${org.id}): ${org.studentCount}/${limit} but no admin emails`);
      continue;
    }

    orgsToNotify++;
    adminsToNotify += admins.length;

    console.log(
      `${execute ? 'Notifying' : '[dry-run] Would notify'} ${org.name} (${org.id}): ${org.studentCount}/${limit} students → ${admins.length} admin(s)`
    );

    if (execute) {
      const upgradeUrl = `https://app.classroomio.com/org/${org.siteName ?? ''}?upgrade=true`;

      await Promise.all(
        admins.map((admin) =>
          sendEmail('studentLimitReached', {
            to: admin.email,
            fields: { orgName: org.name, studentCount: org.studentCount, studentLimit: limit, upgradeUrl }
          })
        )
      );

      await updateOrganization(org.id, {
        settings: { ...org.settings, studentLimitNotified: { half: true, reached: true } }
      });
    }
  }

  console.log(
    `\nFound ${orgs.length} free-plan org(s) over the ${limit}-student limit: ` +
      `${orgsToNotify} to notify (${adminsToNotify} admin email(s) total)` +
      (alreadyNotified ? `, ${alreadyNotified} already notified` : '') +
      (orgsOverWithoutAdmins ? `, ${orgsOverWithoutAdmins} skipped for having no admins` : '') +
      '.'
  );
  console.log(
    execute
      ? `Done. Sent ${adminsToNotify} email(s) across ${orgsToNotify} org(s).`
      : 'Dry run — no emails sent. Re-run with --execute to send.'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
