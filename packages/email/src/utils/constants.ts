import { env } from '../config/env';
import { EMAIL_TEMPLATE_IDS, REQUIRED_EMAIL_TEMPLATE_IDS } from '@cio/utils/constants';

export const EMAIL_IDS = EMAIL_TEMPLATE_IDS;
export const REQUIRED_EMAIL_IDS = REQUIRED_EMAIL_TEMPLATE_IDS;

const DEFAULT_EMAIL_FROM = '"Best from ClassroomIO" <notify@mail.classroomio.com>';

export const EMAIL_FROM = env.SMTP_SENDER || DEFAULT_EMAIL_FROM;
export const EMAIL_REPLY_TO = '"Best from ClassroomIO" <help@classroomio.com>';
