import { Hono } from '@api/utils/hono';
import { htmlContentRouter } from './html';

export const userContentRouter = new Hono().route('/html', htmlContentRouter);
