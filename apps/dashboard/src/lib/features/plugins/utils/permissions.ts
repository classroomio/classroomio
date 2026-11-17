import { getPluginCapability, isSensitiveScope } from '@cio/utils/validation/plugin';
import { t } from '$lib/utils/functions/translations';

export interface FormattedPermission {
  id: string;
  name: string;
  description: string;
  category: 'courses' | 'lessons' | 'progress' | 'certificates' | 'storage' | 'identity' | 'organization' | 'other';
  categoryLabel: string;
  isSensitive: boolean;
}

export type PermissionTranslator = (key: string, payload?: { [key: string]: unknown }) => string;

const CATEGORY_MAP: Record<string, FormattedPermission['category']> = {
  course: 'courses',
  lesson: 'lessons',
  learner: 'progress',
  submission: 'progress',
  grade: 'progress',
  certificate: 'certificates',
  'plugin.storage': 'storage',
  identity: 'identity',
  organization: 'organization',
  cohort: 'organization',
  analytics: 'organization',
  notification: 'other'
};

function resolveCategory(scope: string): FormattedPermission['category'] {
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (scope.startsWith(prefix)) return category;
  }

  return 'other';
}

function resolveFallbackTitle(scope: string, translate: PermissionTranslator): string {
  const parts = scope.split(/[:.]/);
  const resource = parts[0] || translate('plugins.permission_fallback.resource');
  const action = parts[parts.length - 1] || 'access';
  const capitalized = resource.charAt(0).toUpperCase() + resource.slice(1);
  const key =
    action === 'write' ? 'plugins.permission_fallback.manage_title' : 'plugins.permission_fallback.view_title';

  return translate(key, { resource: capitalized });
}

export function formatPluginPermission(scope: string, translate: PermissionTranslator = t.get): FormattedPermission {
  const normalized = scope.trim();
  const capability = getPluginCapability(normalized);
  const category = resolveCategory(normalized);
  const categoryLabel = translate(`plugins.permission_categories.${category}`);
  const isSensitive = isSensitiveScope(normalized);
  const itemKey = normalized.replace(/[.:]/g, '_');

  const name = capability
    ? translate(`plugins.permission_items.${itemKey}.title`)
    : resolveFallbackTitle(normalized, translate);
  const description = capability
    ? translate(`plugins.permission_items.${itemKey}.description`)
    : translate('plugins.permission_fallback.description', { scope: normalized });

  return {
    id: normalized,
    name,
    description,
    category,
    categoryLabel,
    isSensitive
  };
}

export function groupPluginPermissions(
  scopes: string[] = [],
  translate: PermissionTranslator = t.get
): Array<{
  category: FormattedPermission['category'];
  categoryLabel: string;
  permissions: FormattedPermission[];
}> {
  if (!scopes || !Array.isArray(scopes)) {
    return [];
  }

  const formatted = scopes.map((scope) => formatPluginPermission(scope, translate));
  const categoryMap = new Map<
    FormattedPermission['category'],
    { categoryLabel: string; permissions: FormattedPermission[] }
  >();

  for (const perm of formatted) {
    const existing = categoryMap.get(perm.category);
    if (existing) {
      if (!existing.permissions.some((p) => p.name === perm.name)) {
        existing.permissions.push(perm);
      }
    } else {
      categoryMap.set(perm.category, {
        categoryLabel: perm.categoryLabel,
        permissions: [perm]
      });
    }
  }

  const order: FormattedPermission['category'][] = [
    'courses',
    'lessons',
    'progress',
    'certificates',
    'storage',
    'identity',
    'organization',
    'other'
  ];

  return order
    .filter((category) => categoryMap.has(category))
    .map((category) => ({
      category,
      categoryLabel: categoryMap.get(category)!.categoryLabel,
      permissions: categoryMap.get(category)!.permissions
    }));
}

export function summarizePluginPermissions(
  scopes: string[],
  translate: PermissionTranslator = t.get
): Array<{ categoryLabel: string; isSensitive: boolean }> {
  const groups = groupPluginPermissions(scopes, translate);
  return groups.map((g) => ({
    categoryLabel: g.categoryLabel,
    isSensitive: g.permissions.some((p) => p.isSensitive)
  }));
}
