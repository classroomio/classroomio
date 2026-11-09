import * as schema from '@db/schema';
import { ROLE } from '@cio/utils/constants';
import { sql } from 'drizzle-orm';

const orgMemberWithStatus = (status: 'ACTIVE' | 'ARCHIVED') => sql`EXISTS (
  SELECT 1 FROM ${schema.organizationmember}
  WHERE ${schema.organizationmember.organizationId} = ${schema.cohort.organizationId}
    AND ${schema.organizationmember.profileId} = ${schema.cohortMember.profileId}
    AND ${schema.organizationmember.status} = ${sql.raw(`'${status}'`)}
)`;

/**
 * No one archived in the cohort's organization gets in; a cohort student also needs an ACTIVE
 * membership there. Needs `cohort` and `cohort_member` joined.
 */
export const activeInCohortOrgSql = sql`(
  NOT ${orgMemberWithStatus('ARCHIVED')}
  AND (${schema.cohortMember.roleId} <> ${ROLE.STUDENT} OR ${orgMemberWithStatus('ACTIVE')})
)`;
