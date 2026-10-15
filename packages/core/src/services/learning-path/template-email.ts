import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { EmailRegistry, type EmailId } from '@cio/email';
import { enqueueEmailSend, isRedisConfigured } from '@cio/jobs';

/**
 * Slim template-email enqueue that runs in both the API and the worker
 * runtime. Mirrors the API's `enqueueTransactionalEmail` (registry validation,
 * preference respect, idempotent job ids); returns false instead of throwing on
 * delivery failure so one bad email never fails an enrollment chunk or a
 * progress sync.
 */
export async function enqueueWorkerTemplateEmail(
  template: EmailId,
  input: {
    to: string;
    fields: Record<string, unknown>;
    from?: string;
    idempotencyKey?: string;
    preference?: { organizationId: string; recipientProfileId?: string };
  }
): Promise<boolean> {
  const definition = EmailRegistry.get(template);

  if (!definition) {
    throw new Error(`Email template "${template}" is not registered`);
  }

  const validatedFields = definition.schema.parse(input.fields) as Record<string, unknown>;

  if (!isRedisConfigured()) {
    return false;
  }

  if (input.preference) {
    const allowed = await new EmailPreferenceLookupCache().shouldSend({
      emailId: template,
      organizationId: input.preference.organizationId,
      recipientEmail: input.to,
      recipientProfileId: input.preference.recipientProfileId
    });

    if (!allowed) {
      return false;
    }
  }

  const jobId = await enqueueEmailSend(
    {
      kind: 'template',
      template,
      to: input.to,
      fields: validatedFields,
      from: input.from
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}
  );

  return Boolean(jobId);
}
