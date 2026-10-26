import { Hono } from '@api/utils/hono';
import { pluginCatalogRouter } from './catalog';
import { pluginInstallationsRouter } from './installations';
import { pluginAssetsRouter } from './assets';
import { pluginDevelopmentRouter } from './development';

export const pluginsRouter = new Hono()
  .route('/catalog', pluginCatalogRouter)
  .route('/installations', pluginInstallationsRouter)
  .route('/assets', pluginAssetsRouter)
  .route('/development', pluginDevelopmentRouter);
