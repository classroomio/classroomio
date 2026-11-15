import { db, questionType } from '@db/drizzle';
import { syncQuestionTypeIdSequence } from '@db/queries/exercise';

export async function seedQuestionTypes() {
  const existingQuestionTypes = await db.select().from(questionType);
  const questionTypeNames = existingQuestionTypes.map((q) => q.typename);

  const questionTypesToInsert = [
    {
      label: 'Single answer',
      id: 1,
      typename: 'RADIO',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:08.12069+00'
    },
    {
      label: 'Multiple answers',
      id: 2,
      typename: 'CHECKBOX',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:27.935478+00'
    },
    {
      label: 'Paragraph',
      id: 3,
      typename: 'TEXTAREA',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'True/False',
      id: 4,
      typename: 'TRUE_FALSE',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Short answer',
      id: 5,
      typename: 'SHORT_ANSWER',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Numeric answer',
      id: 6,
      typename: 'NUMERIC',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Fill in the blank',
      id: 7,
      typename: 'FILL_BLANK',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'File upload',
      id: 8,
      typename: 'FILE_UPLOAD',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Ordering',
      id: 9,
      typename: 'ORDERING',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Links',
      id: 10,
      typename: 'LINK',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Word bank',
      id: 11,
      typename: 'WORD_BANK',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Star rating',
      id: 12,
      typename: 'STAR',
      createdAt: '2021-08-07 18:49:46.246529+00',
      updatedAt: '2021-08-15 00:57:38.634665+00'
    },
    {
      label: 'Video recording',
      id: 13,
      typename: 'VIDEO_RECORDING',
      createdAt: '2026-04-30 00:00:00+00',
      updatedAt: '2026-04-30 00:00:00+00'
    },
    {
      label: 'Thumbs up/down',
      id: 14,
      typename: 'THUMBS',
      createdAt: '2026-07-23 00:00:00+00',
      updatedAt: '2026-07-23 00:00:00+00'
    },
    {
      label: 'Matching',
      id: 15,
      typename: 'MATCHING',
      createdAt: '2026-11-15 00:00:00+00',
      updatedAt: '2026-11-15 00:00:00+00'
    },
    {
      label: 'Math expression',
      id: 17,
      typename: 'MATH_EXPRESSION',
      createdAt: '2026-11-15 00:00:00+00',
      updatedAt: '2026-11-15 00:00:00+00'
    },
    {
      label: 'Worked solution',
      id: 18,
      typename: 'WORKED_SOLUTION',
      createdAt: '2026-11-15 00:00:00+00',
      updatedAt: '2026-11-15 00:00:00+00'
    }
  ].filter((q) => !questionTypeNames.includes(q.typename));

  if (questionTypesToInsert.length > 0) {
    await syncQuestionTypeIdSequence();
    await db.insert(questionType).values(questionTypesToInsert);
    console.log(`   ✓ Inserted ${questionTypesToInsert.length} question type(s)`);
  } else {
    console.log('   ✓ Question types already exist, skipping');
  }
}
