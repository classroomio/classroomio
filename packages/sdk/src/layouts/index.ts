import type { LayoutDefinition } from '../types';

export interface LayoutOptions {
  /**
   * Override the shell component. Can be a built-in registry key string or a
   * raw Svelte component imported from a plugin package.
   * When omitted the factory's own default key is used.
   */
  shell?: any;
  [key: string]: any;
}

/**
 * Selects the classic sidebar layout.
 * Use this in `classroomio.config.ts` when you want the collapsible left-rail navigation.
 *
 * @example
 * import { sidebar } from '@cio/sdk/layouts';
 * export default defineConfig({ layout: sidebar() });
 */
export function sidebar(options?: LayoutOptions): LayoutDefinition {
  return {
    key: 'sidebar',
    shell: options?.shell ?? 'sidebar'
  };
}
