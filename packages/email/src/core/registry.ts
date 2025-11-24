import * as z from 'zod';

import type { EmailTemplate } from './types';

/**
 * Internal registry that maps email IDs to templates
 */
class EmailRegistryClass {
  private emails = new Map<string, EmailTemplate>();

  /**
   * Register an email template with an ID
   */
  register<TSchema extends z.ZodType>(id: string, template: EmailTemplate<TSchema>): void {
    if (this.emails.has(id)) {
      console.warn(`Email template "${id}" is being registered multiple times. The last registration will be used.`);
    }
    this.emails.set(id, template);
  }

  /**
   * Get an email template by ID
   */
  get(id: string): EmailTemplate | undefined {
    return this.emails.get(id);
  }

  /**
   * Get all registered email IDs
   */
  getAllIds(): string[] {
    return Array.from(this.emails.keys());
  }

  /**
   * Check if an email ID exists
   */
  has(id: string): boolean {
    return this.emails.has(id);
  }
}

export const EmailRegistry = new EmailRegistryClass();
