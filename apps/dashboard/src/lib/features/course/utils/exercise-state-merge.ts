import isEqual from 'lodash/isEqual';

import type { ExerciseSectionState, QuestionnaireState } from '$features/course/components/exercise/store';
import type { Question } from '$features/course/types';

export type ExerciseMergeResolution = 'local' | 'remote';

export interface ExerciseMergeResult {
  conflictCount: number;
  hadLocalChanges: boolean;
  hadRemoteChanges: boolean;
  state: QuestionnaireState;
}

interface MergeValueResult<T> {
  conflictCount: number;
  usedLocal: boolean;
  value: T;
}

function withoutDirtyMarkers<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withoutDirtyMarkers(item)) as T;
  }

  if (value === null || typeof value !== 'object') return value;

  const cleanEntries = Object.entries(value).flatMap(([key, entryValue]) => {
    if (key === 'isDirty' || (key.startsWith('is') && key.endsWith('Dirty'))) return [];

    return [[key, withoutDirtyMarkers(entryValue)]];
  });

  return Object.fromEntries(cleanEntries) as T;
}

function equalEditorValues(left: unknown, right: unknown) {
  return isEqual(withoutDirtyMarkers(left), withoutDirtyMarkers(right));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasEntityId(value: unknown): value is { id: string | number } {
  return isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number');
}

function canMergeEntityArrays(baseValue: unknown[], localValue: unknown[], remoteValue: unknown[]) {
  const values = [...baseValue, ...localValue, ...remoteValue];

  return values.length > 0 && values.every(hasEntityId);
}

function mergeRecords<T extends Record<string, unknown>>(
  baseValue: T,
  localValue: T,
  remoteValue: T,
  resolution: ExerciseMergeResolution
): MergeValueResult<T> {
  const keys = new Set([...Object.keys(baseValue), ...Object.keys(localValue), ...Object.keys(remoteValue)]);
  const value: Record<string, unknown> = {};
  let conflictCount = 0;
  let usedLocal = false;

  for (const key of keys) {
    const mergedValue = mergeValue(baseValue[key], localValue[key], remoteValue[key], resolution);
    conflictCount += mergedValue.conflictCount;
    usedLocal ||= mergedValue.usedLocal;
    value[key] = mergedValue.value;
  }

  return { conflictCount, usedLocal, value: value as T };
}

function mergeValue<T>(
  baseValue: T,
  localValue: T,
  remoteValue: T,
  resolution: ExerciseMergeResolution
): MergeValueResult<T> {
  const localChanged = !equalEditorValues(localValue, baseValue);
  const remoteChanged = !equalEditorValues(remoteValue, baseValue);
  const hasConflict = localChanged && remoteChanged && !equalEditorValues(localValue, remoteValue);

  if (hasConflict) {
    if (isRecord(baseValue) && isRecord(localValue) && isRecord(remoteValue)) {
      return mergeRecords(baseValue, localValue, remoteValue, resolution) as MergeValueResult<T>;
    }

    if (
      Array.isArray(baseValue) &&
      Array.isArray(localValue) &&
      Array.isArray(remoteValue) &&
      canMergeEntityArrays(baseValue, localValue, remoteValue)
    ) {
      const mergedEntities = mergeEntities(baseValue, localValue, remoteValue, resolution);

      return {
        conflictCount: mergedEntities.conflictCount,
        usedLocal: true,
        value: mergedEntities.entities as T
      };
    }

    return {
      conflictCount: 1,
      usedLocal: resolution === 'local',
      value: resolution === 'local' ? localValue : remoteValue
    };
  }

  if (localChanged) {
    return { conflictCount: 0, usedLocal: true, value: localValue };
  }

  return { conflictCount: 0, usedLocal: false, value: remoteValue };
}

function mergeEntities<T extends { id: string | number }>(
  baseEntities: T[],
  localEntities: T[],
  remoteEntities: T[],
  resolution: ExerciseMergeResolution
) {
  const baseById = new Map(baseEntities.map((entity) => [String(entity.id), entity]));
  const localById = new Map(localEntities.map((entity) => [String(entity.id), entity]));
  const remoteById = new Map(remoteEntities.map((entity) => [String(entity.id), entity]));
  const orderedIds = [
    ...localEntities.map((entity) => String(entity.id)),
    ...remoteEntities.map((entity) => String(entity.id)).filter((id) => !localById.has(id))
  ];
  let conflictCount = 0;
  const entities: T[] = [];

  for (const id of orderedIds) {
    const baseEntity = baseById.get(id);
    const localEntity = localById.get(id);
    const remoteEntity = remoteById.get(id);

    if (!baseEntity) {
      if (localEntity && remoteEntity && !equalEditorValues(localEntity, remoteEntity)) {
        conflictCount += 1;
        entities.push(resolution === 'local' ? localEntity : remoteEntity);
      } else if (localEntity || remoteEntity) {
        entities.push((localEntity ?? remoteEntity)!);
      }

      continue;
    }

    if (!localEntity) {
      if (!remoteEntity) continue;

      const remoteChanged = !equalEditorValues(remoteEntity, baseEntity);
      if (remoteChanged) {
        conflictCount += 1;
        if (resolution === 'remote') entities.push(remoteEntity);
      }

      continue;
    }

    if (!remoteEntity) {
      const localChanged = !equalEditorValues(localEntity, baseEntity);

      if (localChanged) {
        conflictCount += 1;
        if (resolution === 'local') entities.push(localEntity);
      }

      continue;
    }

    const mergedEntity = mergeValue(baseEntity, localEntity, remoteEntity, resolution);
    conflictCount += mergedEntity.conflictCount;
    entities.push(mergedEntity.value);
  }

  return { conflictCount, entities };
}

function ensureUniqueQuestionOrder(questions: Question[]) {
  const activeQuestions = questions.filter((question) => !question.deletedAt);
  const seenOrders = new Set<number>();
  const hasDuplicateOrder = activeQuestions.some((question) => {
    if (question.order == null || seenOrders.has(question.order)) return true;

    seenOrders.add(question.order);
    return false;
  });

  if (!hasDuplicateOrder) return questions;

  let nextOrder = 1;
  return questions.map((question) => {
    if (question.deletedAt) return question;

    const orderedQuestion = { ...question, order: nextOrder };
    nextOrder += 1;
    return orderedQuestion;
  });
}

export function hasQuestionnaireChanges(baseState: QuestionnaireState, currentState: QuestionnaireState) {
  return !equalEditorValues(baseState, currentState);
}

export function mergeExerciseStates(
  baseState: QuestionnaireState,
  localState: QuestionnaireState,
  remoteState: QuestionnaireState,
  resolution: ExerciseMergeResolution = 'local'
): ExerciseMergeResult {
  const title = mergeValue(baseState.title, localState.title, remoteState.title, resolution);
  const dueBy = mergeValue(baseState.dueBy, localState.dueBy, remoteState.dueBy, resolution);
  const description = mergeValue(baseState.description, localState.description, remoteState.description, resolution);
  const sectionDisplayMode = mergeValue(
    baseState.sectionDisplayMode,
    localState.sectionDisplayMode,
    remoteState.sectionDisplayMode,
    resolution
  );
  const allowMultipleAttempts = mergeValue(
    baseState.allowMultipleAttempts,
    localState.allowMultipleAttempts,
    remoteState.allowMultipleAttempts,
    resolution
  );
  const completionPolicy = mergeValue(
    baseState.completionPolicy,
    localState.completionPolicy,
    remoteState.completionPolicy,
    resolution
  );
  const passThreshold = mergeValue(
    baseState.passThreshold,
    localState.passThreshold,
    remoteState.passThreshold,
    resolution
  );
  const slug = mergeValue(baseState.slug, localState.slug, remoteState.slug, resolution);
  const questions = mergeEntities<Question>(
    baseState.questions,
    localState.questions,
    remoteState.questions,
    resolution
  );
  const sections = mergeEntities<ExerciseSectionState>(
    baseState.sections,
    localState.sections,
    remoteState.sections,
    resolution
  );
  const mergedValues = [
    title,
    dueBy,
    description,
    sectionDisplayMode,
    allowMultipleAttempts,
    completionPolicy,
    passThreshold,
    slug
  ];
  const conflictCount =
    mergedValues.reduce((total, result) => total + result.conflictCount, 0) +
    questions.conflictCount +
    sections.conflictCount;

  return {
    conflictCount,
    hadLocalChanges: hasQuestionnaireChanges(baseState, localState),
    hadRemoteChanges: hasQuestionnaireChanges(baseState, remoteState),
    state: {
      title: title.value,
      dueBy: dueBy.value,
      isDueByDirty: dueBy.usedLocal && localState.isDueByDirty,
      isTitleDirty: title.usedLocal && localState.isTitleDirty,
      description: description.value,
      isDescriptionDirty: description.usedLocal && localState.isDescriptionDirty,
      questions: ensureUniqueQuestionOrder(questions.entities),
      sections: sections.entities,
      sectionDisplayMode: sectionDisplayMode.value,
      totalSubmissions: remoteState.totalSubmissions,
      allowMultipleAttempts: allowMultipleAttempts.value,
      completionPolicy: completionPolicy.value,
      passThreshold: passThreshold.value,
      slug: slug.value
    }
  };
}
