const {
  TRUSTED_ORIGINS: TRUSTED_ORIGINS_STRING,
  PUBLIC_SERVER_URL,
  AUTH_COOKIE_DOMAIN: AUTH_COOKIE_DOMAIN_STRING
} = process.env;

export const TRUSTED_ORIGINS = TRUSTED_ORIGINS_STRING
  ? TRUSTED_ORIGINS_STRING.split(',')
  : ['http://localhost:5173', 'http://*.classroomio.*'];

export const BASE_URL = PUBLIC_SERVER_URL || 'http://localhost:3002';

export const AUTH_COOKIE_DOMAIN = AUTH_COOKIE_DOMAIN_STRING?.trim() || undefined;
