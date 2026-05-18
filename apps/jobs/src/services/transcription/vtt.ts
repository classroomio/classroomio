import type { TranscriptionSegment } from './openai';

function formatVttTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    seconds = 0;
  }

  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;

  const pad = (n: number, width: number) => n.toString().padStart(width, '0');

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
}

/**
 * Build a minimal WEBVTT caption file from Whisper segment timestamps.
 */
export function segmentsToWebVtt(segments: TranscriptionSegment[]): string {
  const lines = ['WEBVTT', ''];

  let cueIndex = 1;
  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;

    const start = formatVttTime(segment.start);
    const end = formatVttTime(Math.max(segment.end, segment.start + 0.001));

    lines.push(String(cueIndex));
    lines.push(`${start} --> ${end}`);
    lines.push(text);
    lines.push('');
    cueIndex++;
  }

  return lines.join('\n');
}
