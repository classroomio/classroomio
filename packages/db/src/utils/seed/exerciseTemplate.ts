import { db, exerciseTemplate } from '@db/drizzle';

import { TExerciseTemplate } from '@db/types';

const EXERCISE_TEMPLATES_CDN_URL = 'https://assets.cdn.clsrio.com/exerciseTemplates.json';

async function fetchExerciseTemplatesFromCDN(): Promise<TExerciseTemplate[]> {
  const response = await fetch(EXERCISE_TEMPLATES_CDN_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch exercise templates from CDN: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function seedExerciseTemplates() {
  const existingExerciseTemplates = await db.select().from(exerciseTemplate);
  const existingExerciseTemplateTitles = existingExerciseTemplates.map((t) => t.title);

  console.time('fetchExerciseTemplatesFromCDN');
  const templatesData = await fetchExerciseTemplatesFromCDN();
  console.timeEnd('fetchExerciseTemplatesFromCDN');

  const templatesToInsert = templatesData
    .filter((t) => !existingExerciseTemplateTitles.includes(t.title))
    .map((t) => ({
      title: t.title,
      description: t.description,
      questionnaire: t.questionnaire,
      tag: t.tag
    }));

  if (templatesToInsert.length > 0) {
    await db.insert(exerciseTemplate).values(templatesToInsert);

    console.log(`   ✓ Inserted ${templatesToInsert.length} template(s)`);
  } else {
    console.log('   ✓ Templates already exist, skipping');
  }
}
