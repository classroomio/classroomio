import * as schema from '@db/schema';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@db/drizzle';
import type {
  TLocale,
  TNewOrganizationEmailTemplate,
  TNewOrganizationEmailTemplateAudit,
  TOrganizationEmailTemplate,
  TOrganizationEmailTemplateAudit
} from '@db/types';

export interface TResolvedOrganizationEmailTemplate {
  template: TOrganizationEmailTemplate | null;
  resolvedLocale: TLocale | null;
  fallbackUsed: boolean;
}

export async function listOrganizationEmailTemplates(
  organizationId: string,
  filters?: { emailId?: string; locale?: TLocale }
): Promise<TOrganizationEmailTemplate[]> {
  try {
    const conditions = [eq(schema.organizationEmailTemplate.organizationId, organizationId)];

    if (filters?.emailId) {
      conditions.push(eq(schema.organizationEmailTemplate.emailId, filters.emailId));
    }

    if (filters?.locale) {
      conditions.push(eq(schema.organizationEmailTemplate.locale, filters.locale));
    }

    return db
      .select()
      .from(schema.organizationEmailTemplate)
      .where(and(...conditions))
      .orderBy(schema.organizationEmailTemplate.emailId, schema.organizationEmailTemplate.locale);
  } catch (error) {
    console.error('listOrganizationEmailTemplates error:', error);
    throw new Error('Failed to list organization email templates');
  }
}

export async function getOrganizationEmailTemplate(
  organizationId: string,
  emailId: string,
  locale: TLocale
): Promise<TOrganizationEmailTemplate | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.organizationEmailTemplate)
      .where(
        and(
          eq(schema.organizationEmailTemplate.organizationId, organizationId),
          eq(schema.organizationEmailTemplate.emailId, emailId),
          eq(schema.organizationEmailTemplate.locale, locale)
        )
      )
      .limit(1);

    return row || null;
  } catch (error) {
    console.error('getOrganizationEmailTemplate error:', error);
    throw new Error('Failed to get organization email template');
  }
}

export async function upsertOrganizationEmailTemplate(
  values: TNewOrganizationEmailTemplate
): Promise<TOrganizationEmailTemplate> {
  try {
    const now = new Date().toISOString();
    const setValues: {
      isEnabled?: boolean;
      logoUrl?: string | null;
      content?: string | null;
      updatedByProfileId?: string | null;
      updatedAt: string;
    } = {
      updatedAt: now
    };

    if (values.isEnabled !== undefined) {
      setValues.isEnabled = values.isEnabled;
    }

    if ('logoUrl' in values) {
      setValues.logoUrl = values.logoUrl ?? null;
    }

    if ('content' in values) {
      setValues.content = values.content ?? null;
    }

    if ('updatedByProfileId' in values) {
      setValues.updatedByProfileId = values.updatedByProfileId ?? null;
    }

    const [row] = await db
      .insert(schema.organizationEmailTemplate)
      .values({
        ...values,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [
          schema.organizationEmailTemplate.organizationId,
          schema.organizationEmailTemplate.emailId,
          schema.organizationEmailTemplate.locale
        ],
        set: setValues
      })
      .returning();

    if (!row) {
      throw new Error('Failed to upsert organization email template');
    }

    return row;
  } catch (error) {
    console.error('upsertOrganizationEmailTemplate error:', error);
    throw new Error('Failed to upsert organization email template');
  }
}

export async function deleteOrganizationEmailTemplate(
  organizationId: string,
  emailId: string,
  locale: TLocale
): Promise<TOrganizationEmailTemplate | null> {
  try {
    const [row] = await db
      .delete(schema.organizationEmailTemplate)
      .where(
        and(
          eq(schema.organizationEmailTemplate.organizationId, organizationId),
          eq(schema.organizationEmailTemplate.emailId, emailId),
          eq(schema.organizationEmailTemplate.locale, locale)
        )
      )
      .returning();

    return row || null;
  } catch (error) {
    console.error('deleteOrganizationEmailTemplate error:', error);
    throw new Error('Failed to delete organization email template');
  }
}

export async function createOrganizationEmailTemplateAudit(
  values: TNewOrganizationEmailTemplateAudit
): Promise<TOrganizationEmailTemplateAudit> {
  try {
    const [row] = await db.insert(schema.organizationEmailTemplateAudit).values(values).returning();

    if (!row) {
      throw new Error('Failed to create organization email template audit');
    }

    return row;
  } catch (error) {
    console.error('createOrganizationEmailTemplateAudit error:', error);
    throw new Error('Failed to create organization email template audit');
  }
}

export async function listOrganizationEmailTemplateAudit(
  organizationId: string,
  limit: number = 100
): Promise<TOrganizationEmailTemplateAudit[]> {
  try {
    return db
      .select()
      .from(schema.organizationEmailTemplateAudit)
      .where(eq(schema.organizationEmailTemplateAudit.organizationId, organizationId))
      .orderBy(desc(schema.organizationEmailTemplateAudit.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listOrganizationEmailTemplateAudit error:', error);
    throw new Error('Failed to list organization email template audit');
  }
}

export async function getResolvedOrganizationEmailTemplate(
  organizationId: string,
  emailId: string,
  requestedLocale: TLocale
): Promise<TResolvedOrganizationEmailTemplate> {
  try {
    const localeSearchOrder: TLocale[] = requestedLocale === 'en' ? ['en'] : [requestedLocale, 'en'];

    const rows = await db
      .select()
      .from(schema.organizationEmailTemplate)
      .where(
        and(
          eq(schema.organizationEmailTemplate.organizationId, organizationId),
          eq(schema.organizationEmailTemplate.emailId, emailId),
          inArray(schema.organizationEmailTemplate.locale, localeSearchOrder)
        )
      );

    const exact = rows.find((row) => row.locale === requestedLocale);
    if (exact) {
      return {
        template: exact,
        resolvedLocale: requestedLocale,
        fallbackUsed: false
      };
    }

    const englishFallback = rows.find((row) => row.locale === 'en');
    if (englishFallback) {
      return {
        template: englishFallback,
        resolvedLocale: 'en',
        fallbackUsed: requestedLocale !== 'en'
      };
    }

    return {
      template: null,
      resolvedLocale: null,
      fallbackUsed: false
    };
  } catch (error) {
    console.error('getResolvedOrganizationEmailTemplate error:', error);
    throw new Error('Failed to resolve organization email template');
  }
}
