import * as z from 'zod';

export const ZPublicApiDomainResponse = z.object({
  siteName: z.string().nullable().describe('Subdomain the site is served on'),
  siteUrl: z.string().describe('Where students reach the site: the verified custom domain, otherwise the subdomain'),
  favicon: z.string().nullable().describe('Favicon URL, null when the organization logo is used'),
  customDomain: z
    .object({
      hostname: z.string(),
      verified: z
        .boolean()
        .describe('Last known result. POST /organization/domain/custom/refresh checks DNS and SSL again')
    })
    .nullable()
    .describe('Connected custom domain, null when none is connected')
});

export const ZPublicApiCustomDomainSetupResponse = z.object({
  hostname: z.string(),
  status: z.enum(['reconnect_required', 'pending_dns', 'pending_verification', 'verified', 'removed', 'error']),
  verified: z.boolean(),
  reconnectRequired: z.boolean().describe('The provider lost the domain; connect the same hostname again'),
  message: z.string().describe('What to do next'),
  provider: z.literal('approximated'),
  dnsRecords: z
    .array(
      z.object({
        type: z.enum(['A', 'CNAME', 'TXT']),
        name: z.string(),
        value: z.string(),
        status: z.enum(['pending', 'active'])
      })
    )
    .describe('DNS records to add at the domain registrar'),
  validationErrors: z.array(z.string())
});
