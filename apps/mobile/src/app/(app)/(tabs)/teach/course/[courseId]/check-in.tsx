import { useLocalSearchParams } from 'expo-router';

import { TeachCheckIn } from '@/feature/teach/components/teach-check-in';

export default function TeachCheckInScreen() {
  const { courseId = '', lessonId = '' } = useLocalSearchParams<{ courseId: string; lessonId: string }>();

  return <TeachCheckIn courseId={courseId} lessonId={lessonId} />;
}
