import { Stack, useLocalSearchParams } from 'expo-router';

import { ExerciseFlow } from '@/feature/exercise/components/exercise-flow';
import { replaceAnimationOf } from '@/feature/lesson/helpers/open-neighbor';

export default function ExerciseScreen() {
  const { courseId, exerciseId, from } = useLocalSearchParams<{
    courseId: string;
    exerciseId: string;
    from?: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ animationTypeForReplace: replaceAnimationOf(from) }} />
      <ExerciseFlow key={exerciseId} courseId={courseId} exerciseId={exerciseId} />
    </>
  );
}
