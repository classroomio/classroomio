import * as z from 'zod';

/**
 * Branding passed into org-scoped emails so the masthead, logo, and primary
 * button reflect the sending organization rather than ClassroomIO defaults.
 *
 * `themeColor` is always a resolved hex (e.g. `#1d4ed8`) — named org themes are
 * resolved to a hex by `buildEmailBranding` so the template never has to know
 * about ClassroomIO's theme tokens.
 */
export const ZEmailBranding = z
  .object({
    orgName: z.string().optional(),
    logoUrl: z.string().url().optional(),
    themeColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional()
  })
  .optional();

export type EmailBranding = z.infer<typeof ZEmailBranding>;

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * sRGB hex for each named org theme's primary button color. Mirrors the
 * `--primary` token each theme sets in the dashboard (see `app.css`), pinned to
 * plain hex because email clients can't resolve CSS vars or oklch reliably.
 */
const NAMED_THEME_HEX: Record<string, string> = {
  default: '#1d4ed8',
  blue: '#1d4ed8',
  green: '#65a30d',
  amber: '#d97706',
  rose: '#e11d48',
  purple: '#9333ea',
  orange: '#ea580c',
  teal: '#0d9488',
  mono: '#57534e',
  red: '#dc2626',
  yellow: '#facc15',
  violet: '#7c3aed'
};

/**
 * Resolves an org `theme` value to an email-safe hex. Accepts either a named
 * theme token (`blue`, `rose`, …) or a raw hex; returns undefined when the
 * value is empty or unrecognized so callers fall back to the default color.
 */
export function resolveThemeColor(theme?: string | null): string | undefined {
  if (!theme) {
    return undefined;
  }

  const trimmed = theme.trim();
  if (trimmed.startsWith('#')) {
    return HEX_REGEX.test(trimmed) ? trimmed.toLowerCase() : undefined;
  }

  return NAMED_THEME_HEX[trimmed.toLowerCase()];
}

/**
 * Builds the email branding payload from an organization's raw fields. Pass the
 * result as the `branding` field of any org-scoped transactional email.
 */
export function buildEmailBranding(org?: {
  name?: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
}): EmailBranding {
  if (!org) {
    return undefined;
  }

  const orgName = org.name?.trim() || undefined;
  const logoUrl = org.avatarUrl?.trim() || undefined;
  const themeColor = resolveThemeColor(org.theme);

  if (!orgName && !logoUrl && !themeColor) {
    return undefined;
  }

  return { orgName, logoUrl, themeColor };
}
