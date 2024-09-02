export function getIsCourseComplete(
  completions,
  profileId: string | undefined
): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}

export function getPathwayNavItemRoute(pathwayId = '', routeId?: string) {
  const path = `/pathways/${pathwayId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}
export function timeAgo(timestamp: number | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const timeDifference = Math.abs(now.getTime() - date.getTime());
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
}
