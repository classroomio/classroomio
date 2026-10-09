import * as z from 'zod';

export const PLUGIN_PERMISSION_SCOPES = [
  'organization.profile:read',
  'organization.settings:read',
  'courses.metadata:read',
  'courses.content:read',
  'courses:write',
  'lessons.metadata:read',
  'learners.profile:read',
  'learners.progress:read',
  'learners.progress:write',
  'certificates.issued:read',
  'certificate_templates:read',
  'certificate_templates:write',
  'plugin.storage:read',
  'plugin.storage:write',
  'plugin.secrets:read'
] as const;

export type PluginPermissionScope = (typeof PLUGIN_PERMISSION_SCOPES)[number];

export const SENSITIVE_PLUGIN_SCOPES: readonly PluginPermissionScope[] = [
  'organization.settings:read',
  'learners.profile:read',
  'learners.progress:read',
  'learners.progress:write',
  'certificates.issued:read',
  'courses:write',
  'certificate_templates:write',
  'plugin.secrets:read'
] as const;

export const ZPluginPermissionScope = z.enum(PLUGIN_PERMISSION_SCOPES);

export function isSensitiveScope(scope: string): boolean {
  return (SENSITIVE_PLUGIN_SCOPES as readonly string[]).includes(scope);
}
