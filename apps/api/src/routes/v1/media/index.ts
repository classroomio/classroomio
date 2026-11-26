import { Hono } from '@api/utils/hono';
import { v1AssetsRouter } from './assets';
import { v1ImagesRouter } from './images';

export const v1MediaRouter = new Hono().route('/', v1AssetsRouter).route('/images', v1ImagesRouter);
