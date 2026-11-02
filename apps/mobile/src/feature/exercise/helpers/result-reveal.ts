const revealed = new Set<string>();

/** Whether this attempt's result has not been shown yet in this app session. */
export function isUnrevealedResult(attemptId: string) {
  return !revealed.has(attemptId);
}

export function markResultRevealed(attemptId: string) {
  revealed.add(attemptId);
}
