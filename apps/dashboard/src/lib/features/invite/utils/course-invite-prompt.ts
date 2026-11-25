const PROMPTED_STORAGE_KEY = 'classroomio_course_invites_prompted';

export function hasPromptedThisSession(): boolean {
  try {
    return sessionStorage.getItem(PROMPTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markPromptedThisSession(): void {
  try {
    sessionStorage.setItem(PROMPTED_STORAGE_KEY, 'true');
  } catch {
    return;
  }
}
