/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentProps } from 'svelte';
import * as Sidebar from '@cio/ui/base/sidebar';

export interface SidebarData {
  teams: Array<{
    name: string;
    logo: any;
    plan: string;
  }>;
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
  projects: Array<{
    name: string;
    url: string;
    icon: any;
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
