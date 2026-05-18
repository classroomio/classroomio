import * as z from 'zod';

import { blockedSubdomain } from '@cio/utils/constants';

export const ZCreateWorkspace = z.object({
  name: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Workspace name cannot start or end with a hyphen'
    }),
  siteName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Site name cannot start or end with a hyphen'
    })
    .refine((val) => !blockedSubdomain.includes(val), {
      message: 'Sitename already exists.'
    })
});

export type TCreateWorkspace = z.infer<typeof ZCreateWorkspace>;

export const ZWorkspaceIdParam = z.object({
  workspaceId: z.uuid()
});

export type TWorkspaceIdParam = z.infer<typeof ZWorkspaceIdParam>;
