import type { TranscriptSegment } from '@/feature/lesson/types/lesson';

/** Index of the segment playing at `seconds`, or -1 between segments. Segments are sorted by start time. */
export function activeSegmentIndex(segments: TranscriptSegment[], seconds: number) {
  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const middle = (low + high) >> 1;
    const segment = segments[middle]!;
    if (seconds < segment.start) high = middle - 1;
    else if (seconds >= segment.end) low = middle + 1;
    else return middle;
  }

  return -1;
}

export function formatTimestamp(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, '0');

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}
