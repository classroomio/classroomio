import { app } from './app';
import { hc } from 'hono/client';

export type { InferRequestType, InferResponseType } from 'hono/client';
export type Client = ReturnType<typeof hc<typeof app>>;

export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<typeof app>(...args);
