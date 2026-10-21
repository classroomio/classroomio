import * as schema from '@db/schema';

import type {
  TLessonVideoCheckpoint,
  TLessonVideoCheckpointAnswer,
  TLessonVideoCheckpointOption,
  TNewLessonVideoCheckpoint,
  TNewLessonVideoCheckpointAnswer,
  TNewLessonVideoCheckpointOption
} from '@db/types';
import { and, asc, count, db, eq, inArray, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export type LessonVideoCheckpointWithOptions = TLessonVideoCheckpoint & {
  options: TLessonVideoCheckpointOption[];
};

export type LessonVideoCheckpointOptionInput = Pick<
  TNewLessonVideoCheckpointOption,
  'label' | 'value' | 'isCorrect' | 'settings'
>;

export type LessonVideoCheckpointAnswerWithProfile = TLessonVideoCheckpointAnswer & {
  fullname: string | null;
  avatarUrl: string | null;
};

function attachOptions(
  checkpoints: TLessonVideoCheckpoint[],
  options: TLessonVideoCheckpointOption[]
): LessonVideoCheckpointWithOptions[] {
  const optionsByCheckpoint = new Map<string, TLessonVideoCheckpointOption[]>();
  for (const option of options) {
    const bucket = optionsByCheckpoint.get(option.checkpointId) ?? [];
    bucket.push(option);
    optionsByCheckpoint.set(option.checkpointId, bucket);
  }

  return checkpoints.map((checkpoint) => ({ ...checkpoint, options: optionsByCheckpoint.get(checkpoint.id) ?? [] }));
}

export async function listLessonVideoCheckpoints(
  lessonId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointWithOptions[]> {
  try {
    const checkpoints = await dbClient
      .select()
      .from(schema.lessonVideoCheckpoint)
      .where(eq(schema.lessonVideoCheckpoint.lessonId, lessonId))
      .orderBy(asc(schema.lessonVideoCheckpoint.timestampSeconds), asc(schema.lessonVideoCheckpoint.createdAt));
    if (checkpoints.length === 0) return [];

    const options = await dbClient
      .select()
      .from(schema.lessonVideoCheckpointOption)
      .where(
        inArray(
          schema.lessonVideoCheckpointOption.checkpointId,
          checkpoints.map((checkpoint) => checkpoint.id)
        )
      )
      .orderBy(asc(schema.lessonVideoCheckpointOption.order), asc(schema.lessonVideoCheckpointOption.id));

    return attachOptions(checkpoints, options);
  } catch (error) {
    console.error('listLessonVideoCheckpoints error:', error);
    throw new Error(
      `Failed to list video checkpoints for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listLessonVideoCheckpointsByLessonIds(
  lessonIds: string[],
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointWithOptions[]> {
  if (lessonIds.length === 0) return [];

  try {
    const checkpoints = await dbClient
      .select()
      .from(schema.lessonVideoCheckpoint)
      .where(inArray(schema.lessonVideoCheckpoint.lessonId, lessonIds));
    if (checkpoints.length === 0) return [];

    const options = await dbClient
      .select()
      .from(schema.lessonVideoCheckpointOption)
      .where(
        inArray(
          schema.lessonVideoCheckpointOption.checkpointId,
          checkpoints.map((checkpoint) => checkpoint.id)
        )
      )
      .orderBy(asc(schema.lessonVideoCheckpointOption.order), asc(schema.lessonVideoCheckpointOption.id));

    return attachOptions(checkpoints, options);
  } catch (error) {
    console.error('listLessonVideoCheckpointsByLessonIds error:', error);
    throw new Error(
      `Failed to list video checkpoints by lesson ids: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonVideoCheckpointById(
  checkpointId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointWithOptions | null> {
  try {
    const [checkpoint] = await dbClient
      .select()
      .from(schema.lessonVideoCheckpoint)
      .where(eq(schema.lessonVideoCheckpoint.id, checkpointId))
      .limit(1);
    if (!checkpoint) return null;

    const options = await dbClient
      .select()
      .from(schema.lessonVideoCheckpointOption)
      .where(eq(schema.lessonVideoCheckpointOption.checkpointId, checkpointId))
      .orderBy(asc(schema.lessonVideoCheckpointOption.order), asc(schema.lessonVideoCheckpointOption.id));

    return { ...checkpoint, options };
  } catch (error) {
    console.error('getLessonVideoCheckpointById error:', error);
    throw new Error(
      `Failed to get video checkpoint "${checkpointId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countLessonVideoCheckpointsForAsset(
  lessonId: string,
  assetId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.lessonVideoCheckpoint)
      .where(
        and(eq(schema.lessonVideoCheckpoint.lessonId, lessonId), eq(schema.lessonVideoCheckpoint.assetId, assetId))
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countLessonVideoCheckpointsForAsset error:', error);
    throw new Error(
      `Failed to count video checkpoints for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function toOptionRows(checkpointId: string, options: LessonVideoCheckpointOptionInput[]) {
  return options.map((option, index) => ({
    checkpointId,
    label: option.label,
    value: option.value ?? null,
    isCorrect: option.isCorrect ?? false,
    settings: option.settings ?? {},
    order: index
  }));
}

export async function insertLessonVideoCheckpoint(
  data: TNewLessonVideoCheckpoint,
  options: LessonVideoCheckpointOptionInput[],
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointWithOptions> {
  try {
    const [checkpoint] = await dbClient.insert(schema.lessonVideoCheckpoint).values(data).returning();
    if (!checkpoint) throw new Error('Insert returned no row');

    const optionRows =
      options.length > 0
        ? await dbClient
            .insert(schema.lessonVideoCheckpointOption)
            .values(toOptionRows(checkpoint.id, options))
            .returning()
        : [];

    return { ...checkpoint, options: optionRows.sort((left, right) => left.order - right.order) };
  } catch (error) {
    console.error('insertLessonVideoCheckpoint error:', error);
    throw new Error(`Failed to create video checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function replaceLessonVideoCheckpoint(
  checkpointId: string,
  data: Partial<TNewLessonVideoCheckpoint>,
  options: LessonVideoCheckpointOptionInput[],
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointWithOptions | null> {
  try {
    const [checkpoint] = await dbClient
      .update(schema.lessonVideoCheckpoint)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.lessonVideoCheckpoint.id, checkpointId))
      .returning();
    if (!checkpoint) return null;

    await dbClient
      .delete(schema.lessonVideoCheckpointOption)
      .where(eq(schema.lessonVideoCheckpointOption.checkpointId, checkpointId));

    const optionRows =
      options.length > 0
        ? await dbClient
            .insert(schema.lessonVideoCheckpointOption)
            .values(toOptionRows(checkpointId, options))
            .returning()
        : [];

    return { ...checkpoint, options: optionRows.sort((left, right) => left.order - right.order) };
  } catch (error) {
    console.error('replaceLessonVideoCheckpoint error:', error);
    throw new Error(
      `Failed to update video checkpoint "${checkpointId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteLessonVideoCheckpoint(
  checkpointId: string,
  dbClient: DbOrTxClient = db
): Promise<TLessonVideoCheckpoint | null> {
  try {
    const [row] = await dbClient
      .delete(schema.lessonVideoCheckpoint)
      .where(eq(schema.lessonVideoCheckpoint.id, checkpointId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('deleteLessonVideoCheckpoint error:', error);
    throw new Error(
      `Failed to delete video checkpoint "${checkpointId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Removes every checkpoint (and, by cascade, its options and answers) for lesson videos that are no longer attached. */
export async function deleteLessonVideoCheckpointsExceptAssets(
  lessonId: string,
  keepAssetIds: string[],
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const rows = await dbClient
      .select({ id: schema.lessonVideoCheckpoint.id, assetId: schema.lessonVideoCheckpoint.assetId })
      .from(schema.lessonVideoCheckpoint)
      .where(eq(schema.lessonVideoCheckpoint.lessonId, lessonId));

    const orphanIds = rows.filter((row) => !keepAssetIds.includes(row.assetId)).map((row) => row.id);
    if (orphanIds.length === 0) return 0;

    await dbClient.delete(schema.lessonVideoCheckpoint).where(inArray(schema.lessonVideoCheckpoint.id, orphanIds));

    return orphanIds.length;
  } catch (error) {
    console.error('deleteLessonVideoCheckpointsExceptAssets error:', error);
    throw new Error(
      `Failed to delete orphaned video checkpoints for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteLessonVideoCheckpointAnswers(
  checkpointId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .delete(schema.lessonVideoCheckpointAnswer)
      .where(eq(schema.lessonVideoCheckpointAnswer.checkpointId, checkpointId));
  } catch (error) {
    console.error('deleteLessonVideoCheckpointAnswers error:', error);
    throw new Error(
      `Failed to delete answers for video checkpoint "${checkpointId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonVideoCheckpointAnswersForProfile(
  lessonId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TLessonVideoCheckpointAnswer[]> {
  try {
    const rows = await dbClient
      .select({ answer: schema.lessonVideoCheckpointAnswer })
      .from(schema.lessonVideoCheckpointAnswer)
      .innerJoin(
        schema.lessonVideoCheckpoint,
        eq(schema.lessonVideoCheckpoint.id, schema.lessonVideoCheckpointAnswer.checkpointId)
      )
      .where(
        and(
          eq(schema.lessonVideoCheckpoint.lessonId, lessonId),
          eq(schema.lessonVideoCheckpointAnswer.profileId, profileId)
        )
      );

    return rows.map((row) => row.answer);
  } catch (error) {
    console.error('getLessonVideoCheckpointAnswersForProfile error:', error);
    throw new Error(
      `Failed to get video checkpoint answers for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listLessonVideoCheckpointAnswers(
  lessonId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonVideoCheckpointAnswerWithProfile[]> {
  try {
    const rows = await dbClient
      .select({
        answer: schema.lessonVideoCheckpointAnswer,
        fullname: schema.profile.fullname,
        avatarUrl: schema.profile.avatarUrl
      })
      .from(schema.lessonVideoCheckpointAnswer)
      .innerJoin(
        schema.lessonVideoCheckpoint,
        eq(schema.lessonVideoCheckpoint.id, schema.lessonVideoCheckpointAnswer.checkpointId)
      )
      .leftJoin(schema.profile, eq(schema.profile.id, schema.lessonVideoCheckpointAnswer.profileId))
      .where(eq(schema.lessonVideoCheckpoint.lessonId, lessonId))
      .orderBy(asc(schema.lessonVideoCheckpointAnswer.answeredAt));

    return rows.map((row) => ({ ...row.answer, fullname: row.fullname, avatarUrl: row.avatarUrl }));
  } catch (error) {
    console.error('listLessonVideoCheckpointAnswers error:', error);
    throw new Error(
      `Failed to list video checkpoint answers for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonVideoCheckpointAnswer(
  checkpointId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TLessonVideoCheckpointAnswer | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.lessonVideoCheckpointAnswer)
      .where(
        and(
          eq(schema.lessonVideoCheckpointAnswer.checkpointId, checkpointId),
          eq(schema.lessonVideoCheckpointAnswer.profileId, profileId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonVideoCheckpointAnswer error:', error);
    throw new Error(
      `Failed to get video checkpoint answer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function upsertLessonVideoCheckpointAnswer(
  data: TNewLessonVideoCheckpointAnswer,
  dbClient: DbOrTxClient = db
): Promise<TLessonVideoCheckpointAnswer> {
  try {
    const [row] = await dbClient
      .insert(schema.lessonVideoCheckpointAnswer)
      .values(data)
      .onConflictDoUpdate({
        target: [schema.lessonVideoCheckpointAnswer.checkpointId, schema.lessonVideoCheckpointAnswer.profileId],
        set: { answerData: data.answerData, isCorrect: data.isCorrect, updatedAt: sql`now()` }
      })
      .returning();
    if (!row) throw new Error('Upsert returned no row');

    return row;
  } catch (error) {
    console.error('upsertLessonVideoCheckpointAnswer error:', error);
    throw new Error(
      `Failed to save video checkpoint answer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteLessonVideoCheckpointAnswersForProfile(
  profileId: string,
  lessonIds: string[],
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (lessonIds.length === 0) return 0;

  try {
    const checkpointRows = await dbClient
      .select({ id: schema.lessonVideoCheckpoint.id })
      .from(schema.lessonVideoCheckpoint)
      .where(inArray(schema.lessonVideoCheckpoint.lessonId, lessonIds));
    if (checkpointRows.length === 0) return 0;

    const deleted = await dbClient
      .delete(schema.lessonVideoCheckpointAnswer)
      .where(
        and(
          eq(schema.lessonVideoCheckpointAnswer.profileId, profileId),
          inArray(
            schema.lessonVideoCheckpointAnswer.checkpointId,
            checkpointRows.map((row) => row.id)
          )
        )
      )
      .returning({ id: schema.lessonVideoCheckpointAnswer.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteLessonVideoCheckpointAnswersForProfile error:', error);
    throw new Error(
      `Failed to delete video checkpoint answers for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function copyLessonVideoCheckpoints(
  lessonIdMap: ReadonlyMap<string, string>,
  assetIdMap: ReadonlyMap<string, string>,
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (lessonIdMap.size === 0) return 0;

  try {
    const sources = await listLessonVideoCheckpointsByLessonIds([...lessonIdMap.keys()], dbClient);
    for (const source of sources) {
      const targetLessonId = lessonIdMap.get(source.lessonId);
      if (!targetLessonId) continue;

      await insertLessonVideoCheckpoint(
        {
          lessonId: targetLessonId,
          assetId: assetIdMap.get(source.assetId) ?? source.assetId,
          timestampSeconds: source.timestampSeconds,
          questionType: source.questionType,
          title: source.title,
          settings: source.settings,
          resumePolicy: source.resumePolicy
        },
        source.options,
        dbClient
      );
    }

    return sources.length;
  } catch (error) {
    console.error('copyLessonVideoCheckpoints error:', error);
    throw new Error(`Failed to copy video checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
