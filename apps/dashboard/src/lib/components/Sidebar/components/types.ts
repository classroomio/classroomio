import * as Sidebar from '@cio/ui/base/sidebar';

import type { ComponentProps } from 'svelte';
import type { Icon } from '@lucide/svelte';

type SidebarData = {
  navMain: {
    title: string;
    url: string;
    icon?: typeof Icon;
    isActive: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  user: {
    name: string;
    email: string;
    avatar: string;
  };
};

export interface AppSidebar extends ComponentProps<typeof Sidebar.Root> {
  data: SidebarData;
  canAddOrg?: boolean;
}
