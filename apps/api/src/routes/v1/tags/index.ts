import { Hono } from '@api/utils/hono';
import { v1TagGroupsRouter } from './groups';
import { v1TagRouter } from './tag';

export const v1TagsRouter = new Hono().route('/groups', v1TagGroupsRouter).route('/', v1TagRouter);
