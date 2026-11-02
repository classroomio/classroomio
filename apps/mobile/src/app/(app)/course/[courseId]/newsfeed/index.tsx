import { useLocalSearchParams } from 'expo-router';

import { NewsfeedFeed } from '@/feature/newsfeed/components/newsfeed-feed';

export default function CourseNewsfeedScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  return <NewsfeedFeed courseId={courseId} />;
}
