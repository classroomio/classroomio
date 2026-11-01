import { useLocalSearchParams } from 'expo-router';

import { QuestionThread } from '@/feature/community/components/question-thread';

export default function QuestionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return <QuestionThread slug={slug} />;
}
