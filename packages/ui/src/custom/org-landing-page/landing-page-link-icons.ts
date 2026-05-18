import type { Component, ComponentProps } from 'svelte';
import type { LandingPageLinkIcon } from './types';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import CalendarIcon from '@lucide/svelte/icons/calendar';
import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
import MailIcon from '@lucide/svelte/icons/mail';
import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import RocketIcon from '@lucide/svelte/icons/rocket';
import UsersIcon from '@lucide/svelte/icons/users';
import VideoIcon from '@lucide/svelte/icons/video';

export type LinkIconComponent = Component<ComponentProps<typeof HelpCircleIcon>>;

/** Every key in `LandingPageLinkIcon` must map to a Lucide icon component. */
export const landingPageLinkIconMap: Record<LandingPageLinkIcon, LinkIconComponent> = {
  'help-circle': HelpCircleIcon,
  'life-buoy': LifeBuoyIcon,
  'book-open': BookOpenIcon,
  video: VideoIcon,
  users: UsersIcon,
  'message-circle': MessageCircleIcon,
  newspaper: NewspaperIcon,
  rocket: RocketIcon,
  calendar: CalendarIcon,
  mail: MailIcon
};

const FALLBACK_ICON: LandingPageLinkIcon = 'help-circle';

export function resolveLandingPageLinkIcon(value: unknown): LandingPageLinkIcon {
  if (typeof value === 'string' && value in landingPageLinkIconMap) {
    return value as LandingPageLinkIcon;
  }

  return FALLBACK_ICON;
}
