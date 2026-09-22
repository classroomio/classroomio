import { getCohortOrganizationId } from '@cio/db/queries/cohort';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function assertCohortBelongsToOrganization(orgId: string, cohortId: string): Promise<void> {
  const cohortOrganizationId = await getCohortOrganizationId(cohortId);
  if (!cohortOrganizationId || cohortOrganizationId !== orgId) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }
}
