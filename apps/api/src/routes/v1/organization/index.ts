import { Hono } from '@api/utils/hono';
import { v1DomainRouter } from './domain';
import { v1EmailTemplatesRouter } from './email-templates';
import { v1LandingPageRouter } from './landing-page';
import { v1OrganizationProfileRouter } from './organization';

export const v1OrganizationRouter = new Hono()
  .route('/', v1OrganizationProfileRouter)
  .route('/domain', v1DomainRouter)
  .route('/email-templates', v1EmailTemplatesRouter)
  .route('/landing-page', v1LandingPageRouter);
