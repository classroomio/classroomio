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

import { buildEmailBranding, sendEmail } from '@cio/email';
import { PLAN, getStudentLimit, isOrgOnFreePlan } from '@cio/utils/plans';

import {
  countActiveStudents,
  getOrganizationAdminEmails,
  getOrganizations
} from '../queries/organization/organization';

async function main() {
  const execute = process.argv.includes('--execute');
  const orgs = await getOrganizations();
  const limit = getStudentLimit(PLAN.BASIC);

  let notified = 0;

  for (const org of orgs) {
    const isFree = isOrgOnFreePlan({ plans: org.plans, isSelfHosted: false, orgId: org.id });
    if (!isFree) continue;

    const studentCount = await countActiveStudents(org.id);
    if (studentCount <= limit) continue;

    const admins = await getOrganizationAdminEmails(org.id);
    if (!admins.length) {
      console.log(`Skipping ${org.name} (${org.id}): ${studentCount}/${limit} but no admin emails`);
      continue;
    }

    console.log(
      `${execute ? 'Notifying' : '[dry-run] Would notify'} ${org.name} (${org.id}): ${studentCount}/${limit} students → ${admins.length} admin(s)`
    );

    if (execute) {
      const branding = buildEmailBranding({ name: org.name, avatarUrl: org.avatarUrl, theme: org.theme });
      const upgradeUrl = `https://app.classroomio.com/org/${org.siteName ?? ''}?upgrade=true`;

      await Promise.all(
        admins.map((admin) =>
          sendEmail('studentLimitReached', {
            to: admin.email,
            fields: { orgName: org.name, studentCount, studentLimit: limit, upgradeUrl, branding }
          })
        )
      );

      notified++;
    }
  }

  console.log(execute ? `Done. Notified ${notified} org(s).` : 'Dry run complete — re-run with --execute to send.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
