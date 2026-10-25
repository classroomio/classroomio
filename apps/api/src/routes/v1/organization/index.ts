import { Hono } from '@api/utils/hono';
import { v1EmailTemplatesRouter } from './email-templates';

export const v1OrganizationRouter = new Hono().route('/email-templates', v1EmailTemplatesRouter);
