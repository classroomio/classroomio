import SendGridService from '@sendgrid/mail';
import type { MailService } from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '$env/static/private';

export const SENDGRID_FROM = 'Rotimi Best <best@classroomio.com>';
export const SENDGRID_FROM_NOREPLY = 'ClassroomIO <noreply@classroomio.com>';

export let sendgrid: MailService;

export const getSendgrid = (): MailService => {
  if (sendgrid) return sendgrid;

  SendGridService.setApiKey(SENDGRID_API_KEY);

  sendgrid = SendGridService;

  return sendgrid;
};
