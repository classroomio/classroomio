import { db, exerciseTemplate } from '@db/drizzle';
import templatesData from '../../../exerciseTemplates.json';
import { TExerciseTemplate } from '@db/types';

export async function seedExerciseTemplates() {
  const existingExerciseTemplates = await db.select().from(exerciseTemplate);
  const existingExerciseTemplateTitles = existingExerciseTemplates.map((t) => t.title);

  const templatesToInsert = templatesData
    .filter((t) => !existingExerciseTemplateTitles.includes(t.title))
    .map((t) => ({
      title: t.title,
      description: t.description,
      questionnaire: t.questionnaire,
      tag: t.tag
    }));

  if (templatesToInsert.length > 0) {
    await db.insert(exerciseTemplate).values(templatesToInsert as TExerciseTemplate[]);
    console.log(`   ✓ Inserted ${templatesToInsert.length} template(s)`);
  } else {
    console.log('   ✓ Templates already exist, skipping');
  }
}
