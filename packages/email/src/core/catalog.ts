import * as z from 'zod';

import { EmailRegistry } from './registry';
import { EMAIL_IDS, REQUIRED_EMAIL_IDS } from '../utils/constants';
import type { EmailId } from '../utils/types';

const REQUIRED_EMAIL_ID_SET = new Set<EmailId>(REQUIRED_EMAIL_IDS as readonly EmailId[]);

export interface EmailTemplateCatalogItem {
  id: EmailId;
  subject: string;
  placeholders: string[];
  requiredPlaceholders: string[];
  isRequiredTemplate: boolean;
}

function isZodObjectSchema(schema: z.ZodType): schema is z.ZodObject<Record<string, z.ZodType>> {
  return schema instanceof z.ZodObject;
}

function getPlaceholderMetadata(schema: z.ZodType): { placeholders: string[]; requiredPlaceholders: string[] } {
  if (!isZodObjectSchema(schema)) {
    return { placeholders: [], requiredPlaceholders: [] };
  }

  const shape = schema.shape;
  const placeholders = Object.keys(shape);
  const requiredPlaceholders = placeholders.filter((key) => {
    const fieldSchema = shape[key];
    return !fieldSchema.isOptional();
  });

  return { placeholders, requiredPlaceholders };
}

export function getEmailTemplateCatalog(): EmailTemplateCatalogItem[] {
  return EMAIL_IDS.map((id) => {
    const template = EmailRegistry.get(id);
    if (!template) {
      return {
        id,
        subject: '',
        placeholders: [],
        requiredPlaceholders: [],
        isRequiredTemplate: REQUIRED_EMAIL_ID_SET.has(id)
      };
    }

    const metadata = getPlaceholderMetadata(template.schema);
    return {
      id,
      subject: template.subject,
      placeholders: metadata.placeholders,
      requiredPlaceholders: metadata.requiredPlaceholders,
      isRequiredTemplate: REQUIRED_EMAIL_ID_SET.has(id)
    };
  });
}
