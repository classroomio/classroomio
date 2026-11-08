import { SLIDE_PLATFORM_BY_ID, type SlidePlatformId } from '@cio/utils/functions';

export const EXAMPLE_SLIDE = {
  src: 'https://www.canva.com/design/DAHaXRiJEa0/4pV4evpZYshT-SxDYfnuPw/view?embed',
  platform: 'canva'
} as const;

export function slidesFrameTitle(platform: SlidePlatformId): string {
  return SLIDE_PLATFORM_BY_ID[platform]?.name ?? platform;
}
