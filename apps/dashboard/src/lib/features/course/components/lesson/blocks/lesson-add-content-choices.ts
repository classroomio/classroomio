import BookOpenIcon from '@lucide/svelte/icons/book-open';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ImageIcon from '@lucide/svelte/icons/image';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import VideoIcon from '@lucide/svelte/icons/video';
import type { AddBlockChoice } from '@cio/ui/custom/add-block';
import { t } from '$lib/utils/functions/translations';

export function getAddContentChoices(): AddBlockChoice[] {
  return [
    { type: 'note', label: t.get('course.navItem.lessons.materials.blocks.types.note'), icon: BookOpenIcon },
    { type: 'video', label: t.get('course.navItem.lessons.materials.blocks.types.video'), icon: VideoIcon },
    { type: 'slide', label: t.get('course.navItem.lessons.materials.blocks.types.slides'), icon: PresentationIcon },
    { type: 'document', label: t.get('course.navItem.lessons.materials.blocks.types.document'), icon: FileTextIcon },
    { type: 'image', label: t.get('course.navItem.lessons.materials.blocks.types.image'), icon: ImageIcon }
  ];
}
