import { db, template } from '@db/drizzle';
import templatesData from '../../../templates.json';
import { TTemplate } from '@db/types';

export async function seedTemplates() {
  const existingTemplates = await db.select().from(template);
  const existingTemplateTitles = existingTemplates.map((t) => t.title);

  const templatesToInsert = templatesData
    .filter((t) => !existingTemplateTitles.includes(t.title))
    .map((t) => ({
      title: t.title,
      description: t.description,
      questionnaire: t.questionnaire,
      tag: t.tag
    }));

  if (templatesToInsert.length > 0) {
    await db.insert(template).values(templatesToInsert as TTemplate[]);
    console.log(`   ✓ Inserted ${templatesToInsert.length} template(s)`);
  } else {
    console.log('   ✓ Templates already exist, skipping');
  }
}
