import type { Icon } from '@lucide/svelte';

import type { CurrentOrg } from './org';

export interface SidebarData {
  teams: CurrentOrg[];
  navMain: Array<{
    title: string;
    url: string;
    icon?: typeof Icon;
    isActive: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }>;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}
