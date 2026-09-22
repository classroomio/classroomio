import * as z from 'zod';

import { ZCreateCohortGoal, ZUpdateCohortGoal } from '../cohort/cohort';
import { ZPublicApiCohortParam } from './cohort';

export const ZPublicApiCohortGoalParam = ZPublicApiCohortParam.extend({
  goalId: z.string().uuid()
});
export type TPublicApiCohortGoalParam = z.infer<typeof ZPublicApiCohortGoalParam>;

export const ZPublicApiCreateCohortGoal = ZCreateCohortGoal;
export type TPublicApiCreateCohortGoal = z.infer<typeof ZPublicApiCreateCohortGoal>;

export const ZPublicApiUpdateCohortGoal = ZUpdateCohortGoal;
export type TPublicApiUpdateCohortGoal = z.infer<typeof ZPublicApiUpdateCohortGoal>;
