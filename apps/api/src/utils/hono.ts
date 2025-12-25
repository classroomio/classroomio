import { Hono as HonoBase } from 'hono';
import { AuthSession } from '@api/types/auth';

export const Hono = HonoBase<AuthSession>;
