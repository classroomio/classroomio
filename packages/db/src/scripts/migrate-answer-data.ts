/**
 * One-time migration script to backfill answer_data from legacy answers[] and open_answer columns.
 *
 * Prerequisites:
 * 1. Add answer_data jsonb column: ALTER TABLE question_answer ADD COLUMN answer_data jsonb;
 * 2. Run this script
 *
 * Note: The old DB only had radio, checkbox, and paragraph (textarea) question types.
 * Other types did not exist and are skipped.
 *
 * The old answers and open_answer columns are kept (deprecated) for backwards compatibility.
 */

import { db } from '../drizzle';
import { sql } from 'drizzle-orm';
import * as schema from '../schema';
import { eq, inArray } from 'drizzle-orm';
import { QUESTION_TYPE_ID_TO_KEY, type AnswerData, type QuestionTypeKey } from '@cio/question-types';

type LegacyRow = {
  id: number;
  question_id: number;
  answers: string[] | null;
  open_answer: string | null;
};

const SUPPORTED_LEGACY_TYPES: QuestionTypeKey[] = ['RADIO', 'CHECKBOX', 'TEXTAREA'];

/** Convert legacy (answers, open_answer) format to AnswerData. Only supports RADIO, CHECKBOX, TEXTAREA. */
function legacyToAnswerData(
  questionTypeKey: QuestionTypeKey,
  rawValue: string | string[] | null | undefined
): AnswerData | null {
  if (rawValue === null || rawValue === undefined) return null;

  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  switch (questionTypeKey) {
    case 'RADIO': {
      const val = Array.isArray(rawValue) ? rawValue[0] : rawValue;
      const optionId = toNum(val);
      return optionId != null ? { type: 'RADIO', optionId } : null;
    }
    case 'CHECKBOX': {
      const arr = Array.isArray(rawValue) ? rawValue : [rawValue];
      const optionIds = arr.map((v) => toNum(v)).filter((id): id is number => id != null);
      return optionIds.length > 0 ? { type: 'CHECKBOX', optionIds } : null;
    }
    case 'TEXTAREA': {
      const text = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue[0] : String(rawValue);
      return text != null && String(text).trim() !== '' ? { type: 'TEXTAREA', text: String(text) } : null;
    }
    default:
      return null;
  }
}

async function migrate() {
  console.log('Fetching question_answer rows with legacy columns...');

  const result = await getLegacyRows();

  const rowsArray = (Array.isArray(result) ? result : ((result as { rows?: LegacyRow[] }).rows ?? [])) as LegacyRow[];
  console.log(`Found ${rowsArray.length} rows to migrate`);

  if (rowsArray.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  const questionIds = [...new Set(rowsArray.map((r) => r.question_id))];
  const questions = await db
    .select({
      id: schema.question.id,
      questionTypeId: schema.question.questionTypeId
    })
    .from(schema.question)
    .where(inArray(schema.question.id, questionIds));

  const questionById = new Map(questions.map((q) => [q.id, q]));

  const BATCH_SIZE = 100;
  let migrated = 0;

  for (let i = 0; i < rowsArray.length; i += BATCH_SIZE) {
    const batch = rowsArray.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const question = questionById.get(row.question_id);
      if (!question) {
        console.warn(`Question ${row.question_id} not found for answer ${row.id}, skipping`);
        continue;
      }

      const questionTypeKey = QUESTION_TYPE_ID_TO_KEY[question.questionTypeId];
      if (!questionTypeKey) {
        console.warn(`Unknown question type ${question.questionTypeId} for answer ${row.id}, skipping`);
        continue;
      }

      if (!SUPPORTED_LEGACY_TYPES.includes(questionTypeKey)) {
        console.warn(`Question type ${questionTypeKey} was not in the legacy DB, skipping answer ${row.id}`);
        continue;
      }

      const rawValue = Array.isArray(row.answers) && row.answers.length > 0 ? row.answers : (row.open_answer ?? null);

      if (rawValue === null) continue;

      const answerData = legacyToAnswerData(questionTypeKey, rawValue);
      if (!answerData) {
        console.warn(`Could not serialize answer ${row.id} (question ${row.question_id}), skipping`);
        continue;
      }

      await db.update(schema.questionAnswer).set({ answerData }).where(eq(schema.questionAnswer.id, row.id));

      migrated++;
    }

    console.log(`Migrated batch ${i / BATCH_SIZE + 1}, total: ${migrated}`);
  }

  console.log(`Migration complete. Migrated ${migrated} rows.`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

async function getLegacyRows() {
  return await db.execute<LegacyRow>(sql`
    SELECT id, question_id, answers, open_answer
    FROM question_answer
    WHERE answers IS NOT NULL OR open_answer IS NOT NULL
  `);
}
