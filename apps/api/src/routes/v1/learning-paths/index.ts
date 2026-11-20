import { Hono } from '@api/utils/hono';

import { v1LearningPathRouter } from './learning-path';
import { v1LearningPathCoursesRouter } from './courses';
import { v1LearningPathMembersRouter } from './members';

export const v1LearningPathsRouter = new Hono()
  .route('/', v1LearningPathRouter)
  .route('/', v1LearningPathCoursesRouter)
  .route('/', v1LearningPathMembersRouter);
