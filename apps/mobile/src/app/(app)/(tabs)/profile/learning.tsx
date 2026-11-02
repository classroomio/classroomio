import { useLocalSearchParams } from 'expo-router';

import { LearningStatSheet } from '@/feature/account/components/learning-stat-sheet';
import type { LearningStatKind } from '@/feature/account/types/account';

function kindOf(value: string | undefined): LearningStatKind {
  return value === 'completed' || value === 'certificates' ? value : 'in-progress';
}

export default function LearningStatScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();

  return <LearningStatSheet kind={kindOf(kind)} />;
}
