import * as z from 'zod';

export const ZPublicApiMeResponse = z.object({
  organization: z.object({
    id: z.uuid(),
    name: z.string(),
    siteName: z.string().nullable(),
    avatarUrl: z.string().nullable()
  }),
  connection: z.object({
    kind: z
      .enum(['api_key', 'oauth'])
      .describe('oauth for an app connected through OAuth, api_key for an automation key'),
    id: z.uuid().describe('The OAuth grant id, or the automation key id'),
    clientId: z.string().nullable().describe('The OAuth client the token was issued to; null for automation keys'),
    scopes: z.array(z.string())
  }),
  actor: z.object({
    profileId: z.uuid().describe('The admin who connected the app, or who created the key'),
    fullname: z.string().nullable(),
    email: z.string().nullable()
  })
});
export type TPublicApiMeResponse = z.infer<typeof ZPublicApiMeResponse>;
