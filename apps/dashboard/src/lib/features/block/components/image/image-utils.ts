import type { TImageBlockData } from '@cio/utils/validation/block';

const EXAMPLE_IMAGE_PATH = '/images/brand-covers/oversized-mark.webp';

export function createExampleImage(): TImageBlockData {
  return {
    url: new URL(EXAMPLE_IMAGE_PATH, window.location.origin).href,
    alt: 'ClassroomIO logo on a blue background',
    fit: 'cover'
  };
}
