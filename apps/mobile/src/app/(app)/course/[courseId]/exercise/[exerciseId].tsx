import { useLocalSearchParams } from 'expo-router';

import { ExerciseFlow } from '@/feature/exercise/components/exercise-flow';

export default function ExerciseScreen() {
  const { courseId, exerciseId } = useLocalSearchParams<{ courseId: string; exerciseId: string }>();

  return <ExerciseFlow key={exerciseId} courseId={courseId} exerciseId={exerciseId} />;
}
