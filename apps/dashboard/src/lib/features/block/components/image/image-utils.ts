import type { TImageBlockData } from '@cio/utils/validation/block';

const EXAMPLE_IMAGE_PATH = '/images/classroomio-course-img-template.jpg';

export function createExampleImage(): TImageBlockData {
  return {
    url: new URL(EXAMPLE_IMAGE_PATH, window.location.origin).href,
    alt: 'ClassroomIO course banner',
    fit: 'cover'
  };
}
