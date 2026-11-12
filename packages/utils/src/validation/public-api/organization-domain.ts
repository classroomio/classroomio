import * as z from 'zod';

import { ZSiteName } from '../organization/organization';

const SITE_NAME_CHARS = /^[a-z0-9-]{5,63}$/;

export const ZPublicApiUpdateDomain = z
  .object({
    siteName: ZSiteName.refine((val) => SITE_NAME_CHARS.test(val), {
      message: 'Site name must be 5 to 63 lowercase letters, numbers or hyphens'
    })
      .optional()
      .describe(
        'Subdomain the site is served on (<siteName>.<tenant domain>). Changing it breaks every link to the old subdomain'
      ),
    favicon: z
      .url({ protocol: /^https?$/ })
      .nullable()
      .optional()
      .describe('Public http(s) URL of the site favicon, or null to fall back to the organization logo')
  })
  .refine((data) => data.siteName !== undefined || data.favicon !== undefined, {
    message: 'Provide siteName, favicon or both'
  });
export type TPublicApiUpdateDomain = z.infer<typeof ZPublicApiUpdateDomain>;

export const ZPublicApiConnectCustomDomain = z.object({
  hostname: z
    .string()
    .trim()
    .min(1)
    .max(253)
    .describe('Domain to serve the site on, like courses.yourwebsite.com or yourwebsite.com')
});
export type TPublicApiConnectCustomDomain = z.infer<typeof ZPublicApiConnectCustomDomain>;
