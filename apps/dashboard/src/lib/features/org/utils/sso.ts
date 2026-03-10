import type { SsoConfig } from './types';

/** API returns policy.roleMapping as JSONValue; normalize to SsoConfig. */
export function normalizeSsoConfig(
  raw: {
    config: SsoConfig['config'];
    policy: (Omit<NonNullable<SsoConfig['policy']>, 'roleMapping'> & { roleMapping?: unknown }) | null;
  } | null
): SsoConfig {
  if (raw == null || typeof raw !== 'object') {
    return { config: null, policy: null } as SsoConfig;
  }
  const policy = raw.policy;
  const roleMapping: Record<string, number> =
    policy && policy.roleMapping != null && typeof policy.roleMapping === 'object' && !Array.isArray(policy.roleMapping)
      ? (policy.roleMapping as Record<string, number>)
      : {};
  return {
    config: raw.config,
    policy: policy ? { ...policy, roleMapping } : null
  };
}

/** Normalize policy.roleMapping from API (JSONValue) to Record<string, number>. */
export function normalizeSsoPolicy(
  policy: (Omit<NonNullable<SsoConfig['policy']>, 'roleMapping'> & { roleMapping?: unknown }) | null
): SsoConfig['policy'] {
  if (!policy) return null;
  const roleMapping: Record<string, number> =
    policy.roleMapping != null && typeof policy.roleMapping === 'object' && !Array.isArray(policy.roleMapping)
      ? (policy.roleMapping as Record<string, number>)
      : {};
  return { ...policy, roleMapping };
}
