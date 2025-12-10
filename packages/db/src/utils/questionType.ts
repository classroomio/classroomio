import { db, questionType } from '@db/drizzle';

export async function seedTypes() {
  const existingQuestionTypes = await db.select().from(questionType);
  const questionTypeNames = existingQuestionTypes.map((q) => q.typename);

  const questionTypesToInsert = [
    {
      label: 'Single answer',
      typename: 'RADIO',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:08.12069+00'
    },
    {
      label: 'Multiple answers',
      typename: 'CHECKBOX',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:27.935478+00'
    },
    {
      label: 'Paragraph',
      typename: 'TEXTAREA',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    }
  ].filter((q) => !questionTypeNames.includes(q.typename));

  if (questionTypesToInsert.length > 0) {
    await db.insert(questionType).values(questionTypesToInsert);
    console.log(`   ✓ Inserted ${questionTypesToInsert.length} question type(s)`);
  } else {
    console.log('   ✓ Question types already exist, skipping');
  }
}
