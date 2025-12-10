import * as schema from '@db/schema';

import { eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export function getAllTemplates() {
  return db.select().from(schema.template);
}

export async function getTemplateById(id: number) {
  const result = await db.select().from(schema.template).where(eq(schema.template.id, id)).limit(1);
  return result[0];
}

export async function getTemplateByTag(tag: string) {
  const result = await db.select().from(schema.template).where(eq(schema.template.tag, tag));
  return result;
}
