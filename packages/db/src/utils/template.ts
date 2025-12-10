import { db, template } from '@db/drizzle';
import templatesData from '../../templates.json';

export async function seedTemplates() {
  const existingTemplates = await db.select().from(template);
  const existingTemplateTitles = existingTemplates.map((t) => t.title);

  const templatesToInsert = templatesData
    .filter((t: any) => !existingTemplateTitles.includes(t.title))
    .map((t: any) => ({
      title: t.title,
      description: t.description,
      questionnaire: t.questionnaire,
      tag: t.tag
    }));

  if (templatesToInsert.length > 0) {
    await db.insert(template).values(templatesToInsert);
    console.log(`   ✓ Inserted ${templatesToInsert.length} template(s)`);
  } else {
    console.log('   ✓ Templates already exist, skipping');
  }
}
