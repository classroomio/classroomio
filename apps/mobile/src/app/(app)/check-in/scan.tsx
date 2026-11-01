import { router, useLocalSearchParams } from 'expo-router';

import { CheckInScan } from '@/feature/check-in/components/check-in-scan';
import type { CheckInTarget } from '@/feature/check-in/helpers/check-in-code';

export default function CheckInScanScreen() {
  const { lesson, source } = useLocalSearchParams<{ lesson?: string; source?: string }>();

  const submit = ({ lessonId, code }: CheckInTarget) =>
    router.replace({
      pathname: '/check-in',
      params: { lesson: lessonId, code, ...(source === 'lesson' && lessonId === lesson ? { source } : {}) }
    });

  return <CheckInScan lessonId={lesson ?? null} onSubmit={submit} />;
}
