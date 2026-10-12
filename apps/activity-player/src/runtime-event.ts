export type PlayerReportableEventKind = 'initialize' | 'not_initialized' | 'error';

/**
 * Reports one player-observed run-time event. Never throws: diagnostics must not break playback.
 */
export async function reportRuntimeEvent(
  launchToken: string,
  kind: PlayerReportableEventKind,
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch(`/activity/scorm/runtime/${encodeURIComponent(launchToken)}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, detail })
    });
  } catch {
    return;
  }
}
