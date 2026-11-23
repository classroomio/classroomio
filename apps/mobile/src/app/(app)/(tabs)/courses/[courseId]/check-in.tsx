import { useLocalSearchParams } from 'expo-router';

import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import { TeachCheckIn } from '@/feature/teach/components/teach-check-in';

function TeachCheckInScreen() {
  const { courseId = '', lessonId = '' } = useLocalSearchParams<{ courseId: string; lessonId: string }>();

  return <TeachCheckIn courseId={courseId} lessonId={lessonId} />;
}

export default withModalSafeArea(TeachCheckInScreen);
