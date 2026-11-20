import { Hono } from '@api/utils/hono';
import { v1CourseTemplateRouter } from './template';

export const v1CourseTemplatesRouter = new Hono().route('/', v1CourseTemplateRouter);
