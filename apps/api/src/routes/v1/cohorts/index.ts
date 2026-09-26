import { Hono } from '@api/utils/hono';
import { v1CohortRouter } from './cohort';
import { v1CohortCoursesRouter } from './courses';
import { v1CohortGoalsRouter, v1OrgCohortGoalsRouter } from './goals';
import { v1CohortInvitesRouter } from './invites';
import { v1CohortMembersRouter } from './members';
import { v1CohortNewsfeedRouter } from './newsfeed';

export const v1CohortsRouter = new Hono()
  .route('/', v1OrgCohortGoalsRouter)
  .route('/', v1CohortRouter)
  .route('/:cohortId', v1CohortInvitesRouter)
  .route('/:cohortId/members', v1CohortMembersRouter)
  .route('/:cohortId/courses', v1CohortCoursesRouter)
  .route('/:cohortId/newsfeed', v1CohortNewsfeedRouter)
  .route('/:cohortId/goals', v1CohortGoalsRouter);
