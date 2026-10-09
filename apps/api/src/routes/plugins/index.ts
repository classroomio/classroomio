import { Hono } from '@api/utils/hono';
import { pluginCatalogRouter } from './catalog';
import { pluginCredentialsRouter } from './credentials';
import { pluginInstallationsRouter } from './installations';
import { pluginLaunchRouter } from './launch';
import { pluginStorageRouter } from './storage';
import { pluginEventsRouter } from './events';
import { pluginAssetsRouter } from './assets';

export const pluginsRouter = new Hono()
  .route('/catalog', pluginCatalogRouter)
  .route('/installations', pluginInstallationsRouter)
  .route('/installations', pluginStorageRouter)
  .route('/installations', pluginCredentialsRouter)
  .route('/launch', pluginLaunchRouter)
  .route('/events', pluginEventsRouter)
  .route('/assets', pluginAssetsRouter);
