import { Hono } from '@api/utils/hono';
import { v1ExerciseTemplateRouter } from './template';

export const v1ExerciseTemplatesRouter = new Hono().route('/', v1ExerciseTemplateRouter);
