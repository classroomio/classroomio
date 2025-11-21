import type { ComponentProps } from 'svelte';
import * as Sidebar from '@cio/ui/base/sidebar';
import type { SidebarData } from '$lib/utils/types/sidebar';

export interface AppSidebar extends ComponentProps<typeof Sidebar.Root> {
  sidebarData: SidebarData;
  canAddOrg?: boolean;
}
