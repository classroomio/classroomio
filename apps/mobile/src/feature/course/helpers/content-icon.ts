import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { PlayCircleIcon } from 'phosphor-react-native/src/icons/PlayCircle';
import { PresentationIcon } from 'phosphor-react-native/src/icons/Presentation';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { ContentType } from '@cio/utils/constants/content';

import type { AppIcon } from '@/feature/common/components/icon';
import type { CourseContentItem } from '@/feature/course/types/course-detail';

export function contentIconOf(item: CourseContentItem): AppIcon {
  if (item.type === ContentType.Exercise) return ClipboardTextIcon;
  if (item.callUrl) return VideoCameraIcon;
  if ((item.videosCount ?? 0) > 0) return PlayCircleIcon;
  if (item.hasSlideContent) return PresentationIcon;
  if ((item.documentsCount ?? 0) > 0) return FileTextIcon;

  return BookOpenIcon;
}
