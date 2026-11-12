import * as z from 'zod';

export const PUBLIC_API_ORGANIZATION_THEMES = ['blue', 'rose', 'green', 'orange', 'purple'] as const;

// The theme is written into the dashboard's and LMS's CSS, so only the values the dashboard picker can produce are accepted.
const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export const ZPublicApiOrganizationTheme = z
  .union([z.enum(PUBLIC_API_ORGANIZATION_THEMES), z.string().regex(HEX_COLOR)])
  .describe('A preset (blue, rose, green, orange or purple) or a custom color as #RRGGBB or #RRGGBBAA');

export const ZPublicApiUpdateOrganization = z
  .object({
    name: z
      .string()
      .min(5)
      .refine((val) => !/^[-]|[-]$/.test(val), { message: 'Organization name cannot start or end with a hyphen' })
      .optional()
      .describe('At least 5 characters, and cannot start or end with a hyphen'),
    avatarUrl: z
      .url({ protocol: /^https?$/ })
      .optional()
      .describe('Public http(s) URL of the logo image. Upload the image first, then send its URL.'),
    theme: ZPublicApiOrganizationTheme.optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateOrganization = z.infer<typeof ZPublicApiUpdateOrganization>;
