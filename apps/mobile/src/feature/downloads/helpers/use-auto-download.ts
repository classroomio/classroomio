import Storage from 'expo-sqlite/kv-store';
import { useEffect } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { AUTO_DOWNLOAD_SEEN_KEY, FREE_SPACE_MARGIN_BYTES } from '@/feature/downloads/constants/downloads';
import { availableDiskSpace } from '@/feature/downloads/helpers/download-files';
import { planDownload, startDownload } from '@/feature/downloads/helpers/download-manager';
import { useDownloadSettings } from '@/feature/downloads/helpers/download-settings';
import { getCourseDownload } from '@/feature/downloads/helpers/download-store';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

const REQUIRED_COURSE_TYPE = 'COMPLIANCE';

function seenKey(userId: string, orgId: string) {
  return `${AUTO_DOWNLOAD_SEEN_KEY}:${userId}:${orgId}`;
}

function readSeen(userId: string, orgId: string): Set<string> | null {
  try {
    const raw = Storage.getItemSync(seenKey(userId, orgId));

    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function writeSeen(userId: string, orgId: string, ids: Set<string>) {
  void Storage.setItemAsync(seenKey(userId, orgId), JSON.stringify([...ids])).catch(() => {});
}

/** Forgets which required courses were already assigned, so turning the setting on starts from what is assigned now. */
export function resetAutoDownloadBaseline(userId: string, orgId: string) {
  void Storage.removeItemAsync(seenKey(userId, orgId)).catch(() => {});
}

async function downloadInOrder(courseIds: string[], orgId: string) {
  for (const courseId of courseIds) {
    try {
      const plan = await planDownload(courseId);
      const free = availableDiskSpace();
      if (plan.lessons.length === 0 || (free !== null && plan.sizeBytes + FREE_SPACE_MARGIN_BYTES > free)) continue;

      await startDownload(plan, orgId);
    } catch {}
  }
}

/**
 * Downloads compliance courses assigned after "Auto-download required training" was turned on. Courses assigned
 * before that are recorded as seen the first time this runs and are left alone.
 */
export function useAutoDownloadRequired() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const settings = useDownloadSettings();
  const offline = useIsOffline();
  const enrolled = useEnrolledCoursesQuery();
  const required = enrolled.data?.filter((course) => course.type === REQUIRED_COURSE_TYPE).map((course) => course.id);
  const requiredKey = required?.join(',') ?? null;

  useEffect(() => {
    if (!settings.autoDownloadRequired || !userId || !orgId || offline || requiredKey === null) return;

    const ids = requiredKey ? requiredKey.split(',') : [];
    const seen = readSeen(userId, orgId);
    if (!seen) {
      writeSeen(userId, orgId, new Set(ids));
      return;
    }

    const fresh = ids.filter((id) => !seen.has(id) && !getCourseDownload(id));
    if (fresh.length === 0) return;

    writeSeen(userId, orgId, new Set([...seen, ...fresh]));
    void downloadInOrder(fresh, orgId);
  }, [settings.autoDownloadRequired, userId, orgId, offline, requiredKey]);
}
