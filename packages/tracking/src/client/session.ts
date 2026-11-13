const SESSION_COOKIE = 'cio_aid';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export function getSessionId(): string | null {
  return readCookie(SESSION_COOKIE);
}

export function isDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false;
  const dnt =
    (navigator as Navigator & { msDoNotTrack?: string }).doNotTrack ??
    (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}
