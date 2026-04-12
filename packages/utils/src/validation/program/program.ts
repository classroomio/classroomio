import * as z from 'zod';
import { ROLE } from '@cio/utils/constants';

export const ZCreateProgram = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TCreateProgram = z.infer<typeof ZCreateProgram>;

export const ZUpdateProgram = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
});
export type TUpdateProgram = z.infer<typeof ZUpdateProgram>;

export const ZAddCourseToProgram = z.object({
  courseId: z.string().uuid()
});
export type TAddCourseToProgram = z.infer<typeof ZAddCourseToProgram>;

export const ZAddProgramMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        roleId: z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
      })
    )
    .min(1)
    .refine((members) => members.every((member) => member.profileId || member.email), {
      message: 'Each member must include a profileId or email'
    })
});
export type TAddProgramMembers = z.infer<typeof ZAddProgramMembers>;

export const ZUpdateProgramMember = z.object({
  roleId: z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
});
export type TUpdateProgramMember = z.infer<typeof ZUpdateProgramMember>;

export const ZCreateProgramNewsfeed = z.object({
  content: z.string().min(1),
  isPinned: z.boolean().optional()
});
export type TCreateProgramNewsfeed = z.infer<typeof ZCreateProgramNewsfeed>;

export const ZUpdateProgramNewsfeed = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional()
});
export type TUpdateProgramNewsfeed = z.infer<typeof ZUpdateProgramNewsfeed>;

export const ZUpdateProgramReaction = z.object({
  reaction: z.object({
    clap: z.array(z.string()),
    smile: z.array(z.string()),
    thumbsup: z.array(z.string()),
    thumbsdown: z.array(z.string())
  })
});
export type TUpdateProgramReaction = z.infer<typeof ZUpdateProgramReaction>;

export const ZCreateProgramNewsfeedComment = z.object({
  content: z.string().min(1)
});
export type TCreateProgramNewsfeedComment = z.infer<typeof ZCreateProgramNewsfeedComment>;
