import { db, eq, or, question, sql } from '@db/drizzle';
import { seedOptions } from './option';

export async function seedQuestions() {
  // Get max id from the question table
  const maxIdResult = await db.select({ maxId: sql<number>`COALESCE(MAX(${question.id}), 0)` }).from(question);
  let nextId = (maxIdResult[0]?.maxId || 0) + 1;

  const questionsData = [
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
  ];

  const existingQuestions = await db
    .select()
    .from(question)
    .where(or(...questionsData.map((q) => eq(question.title, q.title))));
  const existingQuestionTitles = existingQuestions.map((q) => q.title);

  const questionsToInsert = questionsData
    .filter((q) => !existingQuestionTitles.includes(q.title))
    .map((q) => ({
      ...q,
      id: nextId++
    }));

  let insertedQuestions = [];
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
