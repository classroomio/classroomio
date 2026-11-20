import { Hono } from '@api/utils/hono';
import { v1AssetsRouter } from './assets';

export const v1MediaRouter = new Hono().route('/', v1AssetsRouter);
