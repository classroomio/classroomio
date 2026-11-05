import { Hono } from '@api/utils/hono';
import { pluginCatalogRouter } from './catalog';
import { pluginInstallationsRouter } from './installations';
import { pluginAssetsRouter } from './assets';
import { pluginDevelopmentRouter } from './development';
import { pluginHostedDataRouter } from './hosted-data';

export const pluginsRouter = new Hono()
  .route('/catalog', pluginCatalogRouter)
  .route('/installations', pluginInstallationsRouter)
  .route('/installations', pluginHostedDataRouter)
  .route('/assets', pluginAssetsRouter)
  .route('/development', pluginDevelopmentRouter);
