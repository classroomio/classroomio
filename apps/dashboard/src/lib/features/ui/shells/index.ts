import SidebarShell from './sidebar-shell.svelte';

/**
 * Maps every known layout key to its shell component.
 *
 * To add a new layout:
 *   1. Create the shell component in this directory.
 *   2. Import it above.
 *   3. Add a single entry here.
 *   4. Export a matching factory function from `@cio/sdk/layouts`.
 *   5. Set `layout: yourFactory()` in `classroomio.config.ts`.
 *
 * The route layout file (`org/[slug]/+layout.svelte`) never needs to change.
 */
export const SHELL_REGISTRY: Record<string, any> = {
  sidebar: SidebarShell
};

export { SidebarShell };
