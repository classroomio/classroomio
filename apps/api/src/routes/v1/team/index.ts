import { Hono } from '@api/utils/hono';
import { v1TeamRouter as v1TeamMembersRouter } from './team';

export const v1TeamRouter = new Hono().route('/', v1TeamMembersRouter);
