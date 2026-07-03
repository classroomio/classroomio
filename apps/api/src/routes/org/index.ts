import { orgOgRouter } from './og';
import { Hono } from '@api/utils/hono';

export const orgRouter = new Hono().route('/', orgOgRouter);
