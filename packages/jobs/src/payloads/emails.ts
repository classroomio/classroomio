import * as z from 'zod';

/**
 * Payload for an `emails:send` job that uses a registered `@cio/email`
 * template id. Field shape is validated again inside the worker via the
 * template's Zod schema, so we keep the on-the-wire schema permissive.
 */
export const ZSendTemplateEmailPayload = z.object({
  kind: z.literal('template'),
  template: z.string().min(1),
  to: z.string().email(),
  fields: z.record(z.string(), z.unknown()).default({}),
  from: z.string().optional(),
  replyTo: z.string().optional(),
  /** Override the template's default subject (e.g. org-scoped transactional mail). */
  subject: z.string().min(1).optional(),
  /** Optional iCalendar (.ics) body attached as a text/calendar part. */
  ics: z.string().optional()
});
export type TSendTemplateEmailPayload = z.infer<typeof ZSendTemplateEmailPayload>;

/**
 * Payload for an `emails:send` job that carries free-form subject + content
 * (used by the public mail route and submission notifications that don't have
 * a registered template).
 */
export const ZSendRawEmailPayload = z.object({
  kind: z.literal('raw'),
  to: z.string().email(),
  subject: z.string().min(1),
  content: z.string().min(1),
  from: z.string().optional(),
  replyTo: z.string().optional()
});
export type TSendRawEmailPayload = z.infer<typeof ZSendRawEmailPayload>;

/**
 * Discriminated union BullMQ workers parse on entry. Adding a new email
 * delivery shape is a matter of appending another variant here + a branch in
 * the worker.
 */
export const ZSendEmailPayload = z.discriminatedUnion('kind', [ZSendTemplateEmailPayload, ZSendRawEmailPayload]);
export type TSendEmailPayload = z.infer<typeof ZSendEmailPayload>;
