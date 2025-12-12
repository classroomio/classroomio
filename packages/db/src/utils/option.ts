import { db, eq, option, or } from '@db/drizzle';

export async function seedOptions(insertedQuestions) {
  const questionIds = insertedQuestions.map((q) => q.id);

  // Check if options already exist for these questions
  let existingOptions = [];
  if (questionIds.length > 0) {
    const conditions = questionIds.map((id) => eq(option.questionId, id));
    existingOptions = await db
      .select()
      .from(option)
      .where(or(...conditions));
  }
  const existingOptionQuestionIds = new Set(existingOptions.map((o) => o.questionId));

  // Get question IDs from inserted or existing questions
  const mvcQuestion = insertedQuestions.find((q) => q.exerciseId === 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862');
  const reactQuestion = insertedQuestions.find((q) => q.exerciseId === 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1');
  const pandasQuestion1 = insertedQuestions.find((q) => q.exerciseId === 'bd6e81c7-3d28-4037-acf0-a3028c583771');
  const pandasQuestion2 = insertedQuestions.find((q) => q.exerciseId === 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1');

  const optionsToInsert = [
    // MVC question options
    ...(mvcQuestion
      ? [
          {
            label: 'Modulus, View, Calculus',
            isCorrect: false,
            questionId: mvcQuestion.id
          },
          {
            label: 'Mode, Vue, Controller',
            isCorrect: false,
            questionId: mvcQuestion.id
          },
          {
            label: 'Model, View, Controller',
            isCorrect: true,
            questionId: mvcQuestion.id
          }
        ]
      : []),
    // React question options
    ...(reactQuestion
      ? [
          {
            label: 'It stores React components in a centralized virtual memory.',
            isCorrect: false,
            questionId: reactQuestion.id
          },
          {
            label: 'It facilitates direct communication between the browser and the server.',
            isCorrect: false,
            questionId: reactQuestion.id
          },
          {
            label:
              'It is an in-memory representation of the actual DOM, allowing React to efficiently update and render UI changes.',
            isCorrect: true,
            questionId: reactQuestion.id
          },
          {
            label: 'It handles encryption and decryption for secure data transmission.',
            isCorrect: false,
            questionId: reactQuestion.id
          }
        ]
      : []),
    // Pandas question 1 options
    ...(pandasQuestion1
      ? [
          {
            label: 'drop_null()',
            isCorrect: false,
            questionId: pandasQuestion1.id
          },
          {
            label: 'remove_missing()',
            isCorrect: false,
            questionId: pandasQuestion1.id
          },
          {
            label: 'dropna()',
            isCorrect: true,
            questionId: pandasQuestion1.id
          },
          {
            label: 'clean_data()',
            isCorrect: false,
            questionId: pandasQuestion1.id
          }
        ]
      : []),
    // Pandas question 2 options
    ...(pandasQuestion2
      ? [
          {
            label: 'To increase the size of the dataset',
            isCorrect: false,
            questionId: pandasQuestion2.id
          },
          {
            label: 'To introduce noise and variability',
            isCorrect: false,
            questionId: pandasQuestion2.id
          },
          {
            label: 'To remove errors and inconsistencies',
            isCorrect: true,
            questionId: pandasQuestion2.id
          },
          {
            label: 'To speed up the data processing time',
            isCorrect: false,
            questionId: pandasQuestion2.id
          }
        ]
      : [])
  ].filter((o) => !existingOptionQuestionIds.has(o.questionId));

  if (optionsToInsert.length > 0) {
    await db.insert(option).values(optionsToInsert);
    console.log(`   ✓ Inserted ${optionsToInsert.length} option(s)`);
  } else {
    console.log('   ✓ Options already exist, skipping');
  }
}
