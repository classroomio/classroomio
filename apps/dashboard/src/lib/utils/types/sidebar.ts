/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentProps } from 'svelte';
import * as Sidebar from '@cio/ui/base/sidebar';
import type { CurrentOrg } from './org';

export interface SidebarData {
  teams: CurrentOrg[];
  navMain: Array<{
    title: string;
    url: string;
    icon: any;
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

export interface AppSidebar extends ComponentProps<typeof Sidebar.Root> {
  sidebarData: SidebarData;
  canAddOrg?: boolean;
}
