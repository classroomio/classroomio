import * as schema from '@db/schema';

import { eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export function getAllTemplates() {
  return db.select().from(schema.exerciseTemplate);
}

export async function getTemplateById(id: number) {
  const result = await db.select().from(schema.exerciseTemplate).where(eq(schema.exerciseTemplate.id, id)).limit(1);
  return result[0];
}

export async function getTemplateByTag(tag: string) {
  const result = await db.select().from(schema.exerciseTemplate).where(eq(schema.exerciseTemplate.tag, tag));
  return result;
}
