import * as z from 'zod';

export const ZPublicApiSkillResponse = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  framework: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ZPublicApiSkillWithCountResponse = ZPublicApiSkillResponse.extend({
  questionCount: z.number().describe('Questions tagged with this skill')
});

export const ZPublicApiSkillImportResponse = z.object({
  dryRun: z.boolean(),
  imported: z.boolean(),
  toCreate: z.number(),
  toUpdate: z.number(),
  rows: z.array(
    z.object({
      line: z.number(),
      action: z.enum(['create', 'update']),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      framework: z.string().nullable(),
      parentCode: z.string().nullable()
    })
  ),
  errors: z.array(z.object({ line: z.number(), code: z.string().nullable(), message: z.string() }))
});

export const ZPublicApiQuestionSkillsResponse = z.object({
  questionId: z.number(),
  skillIds: z.array(z.string().uuid())
});

const ZSkillMasteryLevel = z.enum(['not_started', 'learning', 'proficient', 'mastered']);

export const ZPublicApiSkillMasteryResponse = z.object({
  skills: z.array(z.object({ id: z.string().uuid(), code: z.string(), name: z.string() })),
  students: z.array(
    z.object({
      profileId: z.string().uuid(),
      mastery: z.record(z.string(), z.object({ level: ZSkillMasteryLevel }))
    })
  ),
  summary: z.array(
    z.object({
      skillId: z.string().uuid(),
      levels: z.object({ not_started: z.number(), learning: z.number(), proficient: z.number(), mastered: z.number() })
    })
  )
});
