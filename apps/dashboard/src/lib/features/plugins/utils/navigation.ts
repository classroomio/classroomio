import type { TPluginManifest } from '@cio/utils/validation/plugin';
import type { InstalledPluginItem } from './types';

export function hasPluginNavigation(
  installation: InstalledPluginItem,
  location: string,
  isOrganizationAdmin: boolean
): boolean {
  if (installation.status !== 'active') return false;

  const contributions = (installation.manifest as TPluginManifest | null)?.contributes;
  if (!contributions) return false;

  return (contributions.navigation ?? []).some(
    (item) =>
      item.location === location &&
      (item.visibility !== 'organization.admin' || isOrganizationAdmin) &&
      (contributions.pages ?? []).some((page) => page.id === item.page)
  );
}
