import { Hono } from '@api/utils/hono';
import { v1CertificateVerifyRouter } from './verify';

export const v1KeylessCertificatesRouter = new Hono().route('/verify', v1CertificateVerifyRouter);
