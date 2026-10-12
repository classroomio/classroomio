import * as z from 'zod';

import { ACTIVITY_KINDS, type TActivityKind } from '../../constants/activity';

export const ZActivityKind = z.enum(ACTIVITY_KINDS);

export const ZActivityCreate = z.object({
  kind: ZActivityKind,
  sectionId: z.string().optional(),
  title: z.string().min(1)
});
export type TActivityCreate = z.infer<typeof ZActivityCreate>;

export const ZActivityUpdate = z.object({
  title: z.string().min(1).optional(),
  instructions: z.string().optional(),
  isUnlocked: z.boolean().optional()
});
export type TActivityUpdate = z.infer<typeof ZActivityUpdate>;

export const ZActivityAttachPackage = z.object({
  assetId: z.uuid()
});
export type TActivityAttachPackage = z.infer<typeof ZActivityAttachPackage>;

export const ZActivityParam = z.object({
  activityId: z.string().min(1)
});
export type TActivityParam = z.infer<typeof ZActivityParam>;

export const ZActivityLaunch = z.object({
  unitIdentifier: z.string().min(1).optional(),
  newAttempt: z.boolean().optional()
});
export type TActivityLaunch = z.infer<typeof ZActivityLaunch>;

export type { TActivityKind };
