const { TRUSTED_ORIGINS: TRUSTED_ORIGINS_STRING, SERVER_URL } = process.env;

export const TRUSTED_ORIGINS = TRUSTED_ORIGINS_STRING
  ? TRUSTED_ORIGINS_STRING.split(',')
  : ['http://localhost:5173', 'http://*.classroomio.*'];

export const BASE_URL = SERVER_URL || 'http://localhost:3002';
