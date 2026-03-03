import { EMAIL_IDS } from './constants';
import type { EmailSchemas } from '../emails';

export type EmailSkipReason = 'TEMPLATE_DISABLED';

export interface EmailResponse {
  success: boolean;
  skipped?: boolean;
  reason?: EmailSkipReason;
  error?: string;
  details?: unknown;
}

export interface FromData {
  name: string;
  email: string;
}
export type EmailId = (typeof EMAIL_IDS)[number];

/**
 * Conditional type that looks up the schema type for a given EmailId
 *
 * @example
 * type ForgotPasswordSchema = EmailSchemaFor<'forgotPassword'>;
 */
export type EmailSchemaFor<TEmailId extends EmailId> = TEmailId extends keyof EmailSchemas
  ? EmailSchemas[TEmailId]
  : never;
