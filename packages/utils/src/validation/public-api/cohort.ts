import * as z from 'zod';

import { ZCreateCohort, ZUpdateCohort } from '../cohort/cohort';

export const ZPublicApiCohortParam = z.object({
  cohortId: z.string().uuid()
});
export type TPublicApiCohortParam = z.infer<typeof ZPublicApiCohortParam>;

export const ZPublicApiCreateCohort = ZCreateCohort;
export type TPublicApiCreateCohort = z.infer<typeof ZPublicApiCreateCohort>;

export const ZPublicApiUpdateCohort = ZUpdateCohort;
export type TPublicApiUpdateCohort = z.infer<typeof ZPublicApiUpdateCohort>;
