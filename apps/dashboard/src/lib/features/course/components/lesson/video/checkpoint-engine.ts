import type { VideoCheckpoint } from '$features/course/utils/types';

function firstUnsatisfied(checkpoints: VideoCheckpoint[], satisfiedIds: Iterable<string>): VideoCheckpoint | undefined {
  const satisfied = new Set(satisfiedIds);

  return [...checkpoints]
    .filter((checkpoint) => !satisfied.has(checkpoint.id))
    .sort((left, right) => left.timestampSeconds - right.timestampSeconds)[0];
}

/** The checkpoint whose time the playhead has reached and that the learner has not yet satisfied. */
export function getNextUnansweredCheckpoint(
  checkpoints: VideoCheckpoint[],
  satisfiedIds: Iterable<string>,
  currentSeconds: number
): VideoCheckpoint | undefined {
  const next = firstUnsatisfied(checkpoints, satisfiedIds);

  return next && currentSeconds + 0.05 >= next.timestampSeconds ? next : undefined;
}

/** Furthest second playback may reach: the time of the first unsatisfied checkpoint. */
export function getSeekCeilingSeconds(
  checkpoints: VideoCheckpoint[],
  satisfiedIds: Iterable<string>
): number | undefined {
  return firstUnsatisfied(checkpoints, satisfiedIds)?.timestampSeconds;
}
