import { useLocalSearchParams } from 'expo-router';

import { PathDetail } from '@/feature/learning-path/components/path-detail';

export default function LearningPathScreen() {
  const { pathId } = useLocalSearchParams<{ pathId: string }>();

  return <PathDetail pathId={pathId} />;
}
