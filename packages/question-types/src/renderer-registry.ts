import type { ExerciseRendererDefinition, ExerciseRendererMode, ExerciseQuestionTypeKey } from './exercise-types';

export type ExerciseRendererRegistry<TRenderer> = Partial<
  Record<ExerciseQuestionTypeKey, ExerciseRendererDefinition<TRenderer>>
>;

export function getRendererDefinition<TRenderer>(
  registry: ExerciseRendererRegistry<TRenderer>,
  questionType: ExerciseQuestionTypeKey,
  fallback: ExerciseRendererDefinition<TRenderer>
): ExerciseRendererDefinition<TRenderer> {
  return registry[questionType] ?? fallback;
}

export function getRendererForMode<TRenderer>(
  registry: ExerciseRendererRegistry<TRenderer>,
  questionType: ExerciseQuestionTypeKey,
  mode: ExerciseRendererMode,
  fallback: ExerciseRendererDefinition<TRenderer>
): TRenderer {
  const resolvedMode = mode === 'view' ? 'take' : mode;
  return getRendererDefinition(registry, questionType, fallback)[resolvedMode];
}
