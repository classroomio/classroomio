import * as z from 'zod';

// Response shape for OpenAPI docs only; handlers don't validate against it.
export const ZPublicApiOrganizationResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  siteName: z.string().nullable().describe('Subdomain of the organization site. Read-only.'),
  avatarUrl: z.string().nullable().describe('Logo URL, null when no logo is set'),
  theme: z.string().nullable().describe('A preset (blue, rose, green, orange or purple) or a custom hex color')
});
