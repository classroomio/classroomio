import { db, eq, or, question } from '@db/drizzle';
import { seedOptions } from './option';

export async function seedQuestions() {
  const existingQuestions = await db
    .select()
    .from(question)
    .where(
      or(
        eq(question.exerciseId, 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862'),
        eq(question.exerciseId, 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1'),
        eq(question.exerciseId, 'bd6e81c7-3d28-4037-acf0-a3028c583771'),
        eq(question.exerciseId, 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1')
      )
    );
  const existingQuestionExerciseIds = existingQuestions.map((q) => q.exerciseId);

  const questionsToInsert = [
    {
      questionTypeId: 2, // CHECKBOX
      title: 'What does MVC stand for',
      exerciseId: 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862',
      points: 0,
      order: 0
    },
    {
      questionTypeId: 2, // CHECKBOX
      title:
        "What is the purpose of the virtual DOM in React, and how does it contribute to the framework's performance optimization?",
      exerciseId: 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
      points: 10,
      order: 0
    },
    {
      questionTypeId: 2, // CHECKBOX
      title: 'When working with Pandas, what function is used to drop missing values from a DataFrame?',
      exerciseId: 'bd6e81c7-3d28-4037-acf0-a3028c583771',
      points: 20,
      order: 0
    },
    {
      questionTypeId: 2, // CHECKBOX
      title: 'What is the primary purpose of data cleaning in the context of data preprocessing?',
      exerciseId: 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1',
      points: 0,
      order: 0
    }
  ].filter((q) => !existingQuestionExerciseIds.includes(q.exerciseId));

  let insertedQuestions: any[] = [];
  if (questionsToInsert.length > 0) {
    const result = await db.insert(question).values(questionsToInsert).returning();
    insertedQuestions = result;
    console.log(`   ✓ Inserted ${questionsToInsert.length} question(s)`);
  } else {
    console.log('   ✓ Questions already exist, skipping');
    insertedQuestions = existingQuestions;
  }

  // Seed options for questions
  console.log('📝 Seeding question options...');
  await seedOptions(insertedQuestions);
}
