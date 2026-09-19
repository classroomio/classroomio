import type { LessonVideoCheckpoint } from './checkpoint-types';

export function getNextUnansweredCheckpoint(
  checkpoints: LessonVideoCheckpoint[],
  answeredIds: Iterable<string>,
  currentSeconds: number
): LessonVideoCheckpoint | undefined {
  const answered = new Set(answeredIds);

  return [...checkpoints]
    .filter((checkpoint) => !answered.has(checkpoint.id))
    .sort((left, right) => left.timestampSeconds - right.timestampSeconds)
    .find((checkpoint) => currentSeconds + 0.05 >= checkpoint.timestampSeconds);
}

export function getSeekCeilingSeconds(
  checkpoints: LessonVideoCheckpoint[],
  answeredIds: Iterable<string>
): number | undefined {
  const answered = new Set(answeredIds);
  const next = [...checkpoints]
    .filter((checkpoint) => !answered.has(checkpoint.id))
    .sort((left, right) => left.timestampSeconds - right.timestampSeconds)[0];

  return next?.timestampSeconds;
}
