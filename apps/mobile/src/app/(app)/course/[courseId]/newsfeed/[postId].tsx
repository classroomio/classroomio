import { useLocalSearchParams } from 'expo-router';

import { NewsfeedPostThread } from '@/feature/newsfeed/components/newsfeed-post-thread';

export default function NewsfeedPostScreen() {
  const { courseId, postId } = useLocalSearchParams<{ courseId: string; postId: string }>();

  return <NewsfeedPostThread courseId={courseId} postId={postId} />;
}
