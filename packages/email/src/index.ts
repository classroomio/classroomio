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
export { sendEmail, defineEmail } from './send';

// Export types for advanced usage
export type { EmailTemplate, EmailDefinition, SendConfig, DefineEmailConfig } from './core/types';
export type { EmailId, EmailSchemaFor } from './utils/types';

// Re-export low-level utilities
export { deliverEmail } from './send';
export { getDefaultTemplate } from './templates/default';

// Export email registry for introspection (optional)
export { EmailRegistry } from './core/registry';
