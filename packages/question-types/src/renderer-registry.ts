import type { ExerciseQuestionTypeKey, ExerciseRendererDefinition, ExerciseRendererMode } from './exercise-types';

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
  const rendererDefinition = getRendererDefinition(registry, questionType, fallback);
  const resolvedMode = mode === 'view' ? 'take' : mode;
  if (resolvedMode === 'review') {
    return (rendererDefinition.review ?? rendererDefinition.take) as TRenderer;
  }
  return rendererDefinition[resolvedMode] as TRenderer;
}
