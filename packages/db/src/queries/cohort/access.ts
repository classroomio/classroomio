import * as schema from '@db/schema';
import { sql } from 'drizzle-orm';

/** True unless the cohort member is archived in the cohort's organization. Needs `cohort` and `cohort_member` joined. */
export const notArchivedInCohortOrgSql = sql`NOT EXISTS (
  SELECT 1 FROM ${schema.organizationmember}
  WHERE ${schema.organizationmember.organizationId} = ${schema.cohort.organizationId}
    AND ${schema.organizationmember.profileId} = ${schema.cohortMember.profileId}
    AND ${schema.organizationmember.status} = 'ARCHIVED'
)`;
