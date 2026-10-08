import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import type { EmailLocale, StudentEmailId } from '@cio/utils/email';
import { and, eq } from 'drizzle-orm';

export async function listOrganizationStudentEmailTemplates(organizationId: string) {
  try {
    return await db
      .select()
      .from(schema.organizationStudentEmailTemplate)
      .where(eq(schema.organizationStudentEmailTemplate.organizationId, organizationId));
  } catch (error) {
    console.error('listOrganizationStudentEmailTemplates error:', error);
    throw new Error('Failed to list organization student email templates');
  }
}

export async function getOrganizationStudentEmailTemplate(
  organizationId: string,
  emailId: StudentEmailId,
  locale: EmailLocale
) {
  try {
    const [template] = await db
      .select({
        content: schema.organizationStudentEmailTemplate.content,
        subject: schema.organizationStudentEmailTemplate.subject
      })
      .from(schema.organizationStudentEmailTemplate)
      .where(
        and(
          eq(schema.organizationStudentEmailTemplate.organizationId, organizationId),
          eq(schema.organizationStudentEmailTemplate.emailId, emailId),
          eq(schema.organizationStudentEmailTemplate.locale, locale)
        )
      )
      .limit(1);

    return template;
  } catch (error) {
    console.error('getOrganizationStudentEmailTemplate error:', error);
    throw new Error('Failed to get organization student email template');
  }
}

export async function upsertOrganizationStudentEmailTemplate(input: {
  organizationId: string;
  emailId: StudentEmailId;
  locale: EmailLocale;
  content: string;
  subject?: string | null;
}) {
  try {
    const [template] = await db
      .insert(schema.organizationStudentEmailTemplate)
      .values({
        organizationId: input.organizationId,
        emailId: input.emailId,
        locale: input.locale,
        content: input.content,
        subject: input.subject ?? null
      })
      .onConflictDoUpdate({
        target: [
          schema.organizationStudentEmailTemplate.organizationId,
          schema.organizationStudentEmailTemplate.emailId,
          schema.organizationStudentEmailTemplate.locale
        ],
        set: {
          content: input.content,
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          updatedAt: new Date().toISOString()
        }
      })
      .returning();

    return template;
  } catch (error) {
    console.error('upsertOrganizationStudentEmailTemplate error:', error);
    throw new Error('Failed to upsert organization student email template');
  }
}

export async function deleteOrganizationStudentEmailTemplate(
  organizationId: string,
  emailId: StudentEmailId,
  locale: EmailLocale
) {
  try {
    const [template] = await db
      .delete(schema.organizationStudentEmailTemplate)
      .where(
        and(
          eq(schema.organizationStudentEmailTemplate.organizationId, organizationId),
          eq(schema.organizationStudentEmailTemplate.emailId, emailId),
          eq(schema.organizationStudentEmailTemplate.locale, locale)
        )
      )
      .returning({ emailId: schema.organizationStudentEmailTemplate.emailId });

    return Boolean(template);
  } catch (error) {
    console.error('deleteOrganizationStudentEmailTemplate error:', error);
    throw new Error('Failed to delete organization student email template');
  }
}
