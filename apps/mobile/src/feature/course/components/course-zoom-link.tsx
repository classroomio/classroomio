import { Link } from 'expo-router';
import type { ReactElement } from 'react';

import { tapHaptic } from '@/feature/common/helpers/haptics';

/** Opens the course page; on iOS 18+ the page zooms out of `children`, which must be a single pressable. */
export function CourseZoomLink({ courseId, children }: { courseId: string; children: ReactElement }) {
  return (
    <Link href={{ pathname: '/course/[courseId]', params: { courseId } }} push asChild onPress={tapHaptic}>
      <Link.AppleZoom>{children}</Link.AppleZoom>
    </Link>
  );
}
