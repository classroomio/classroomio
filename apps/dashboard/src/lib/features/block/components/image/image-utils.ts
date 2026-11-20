import { DEFAULT_IMAGE_BLOCK_IMAGE } from '@cio/ui/custom/block';
import type { TImageBlockData } from '@cio/utils/validation/block';

export function createExampleImage(): TImageBlockData {
  const url = new URL(DEFAULT_IMAGE_BLOCK_IMAGE, window.location.origin).href;

  return {
    url,
    alt: 'ClassroomIO logo on a blue background',
    fit: 'cover'
  };
}
