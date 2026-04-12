/** FNV-1a–style hash for stable, client-only placeholder picks (e.g. icon per course). */
export function hashStringToUInt32(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function buildCoursePlaceholderAvatarUrl(seed: string): string {
  const stableSeed = hashStringToUInt32(seed).toString(36);

  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(stableSeed)}`;
}
