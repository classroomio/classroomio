/**
 * @cio/email - Unified Email Package
 *
 * Declarative schema-only email system with unified send() API
 *
 * @example
 * ```ts
 * import { sendEmail } from '@cio/email';
 *
 * await sendEmail('forgotPassword', {
 *   to: 'user@example.com',
 *   fields: {
 *     name: 'John Doe',
 *     email: 'user@example.com',
 *     link: 'https://app.classroomio.com/reset?token=abc123'
 *   }
 * });
 * ```
 */

// Pre-import all emails to register them in the registry
import './emails/index';

// Export unified API
export { sendEmail, defineEmail, setEmailTemplateResolver } from './send';

// Export types for advanced usage
export type {
  EmailTemplate,
  EmailDefinition,
  SendConfig,
  DefineEmailConfig,
  SendContext,
  EmailTemplateResolver,
  ResolvedEmailTemplateOverride
} from './core/types';
export type { EmailId, EmailSchemaFor } from './utils/types';
export { getEmailTemplateCatalog } from './core/catalog';
export type { EmailTemplateCatalogItem } from './core/catalog';

// Re-export low-level utilities
export { deliverEmail } from './send';
export { buildEmailFromName } from './utils/functions/email-helpers';
export { getDefaultTemplate } from './templates/default';
export { applyDefaultTemplateOverrides } from './utils/functions/template-overrides';

// Export email registry for introspection (optional)
export { EmailRegistry } from './core/registry';
