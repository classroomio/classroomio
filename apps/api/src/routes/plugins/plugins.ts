import { Hono } from '@api/utils/hono';
import { capabilitiesRouter } from './capabilities';
import { pluginApiRoutes } from './api-route-registry';

const certificateStudioApi = pluginApiRoutes.certificateStudio;

export const pluginsRouter = new Hono()
  .route('/capabilities', capabilitiesRouter)
  .use(certificateStudioApi.mountPath, certificateStudioApi.guard)
  .use(`${certificateStudioApi.mountPath}/*`, certificateStudioApi.guard)
  .route(certificateStudioApi.mountPath, certificateStudioApi.router);
