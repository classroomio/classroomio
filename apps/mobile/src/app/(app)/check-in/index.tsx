import { useLocalSearchParams } from 'expo-router';

import { checkInTargetOf } from '@/feature/check-in/helpers/check-in-code';
import { CheckInSubmission } from '@/feature/check-in/components/check-in-submission';

export default function CheckInScreen() {
  const params = useLocalSearchParams<{ lesson?: string; code?: string; source?: string }>();

  return <CheckInSubmission target={checkInTargetOf(params)} fromLesson={params.source === 'lesson'} />;
}
