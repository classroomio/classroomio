import * as z from 'zod';

import {
  SKILL_CODE_MAX_LENGTH,
  SKILL_FRAMEWORK_MAX_LENGTH,
  SKILL_IMPORT_MAX_ROWS,
  SKILL_NAME_MAX_LENGTH
} from '../../skills/skill-csv';

export const SKILL_QUESTION_LIMIT = 20;
export const SKILL_CSV_MAX_LENGTH = 1_000_000;

export const ZSkillParam = z.object({
  skillId: z.uuid()
});
export type TSkillParam = z.infer<typeof ZSkillParam>;

export const ZSkillListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  framework: z.string().trim().max(SKILL_FRAMEWORK_MAX_LENGTH).optional()
});
export type TSkillListQuery = z.infer<typeof ZSkillListQuery>;

export const ZSkillCreate = z.object({
  code: z.string().trim().min(1).max(SKILL_CODE_MAX_LENGTH),
  name: z.string().trim().min(1).max(SKILL_NAME_MAX_LENGTH),
  description: z.string().trim().max(2000).nullish(),
  parentId: z.uuid().nullish(),
  framework: z.string().trim().max(SKILL_FRAMEWORK_MAX_LENGTH).nullish()
});
export type TSkillCreate = z.infer<typeof ZSkillCreate>;

export const ZSkillUpdate = ZSkillCreate.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
});
export type TSkillUpdate = z.infer<typeof ZSkillUpdate>;

export const ZSkillImport = z.object({
  csv: z.string().min(1).max(SKILL_CSV_MAX_LENGTH),
  dryRun: z.boolean().default(false)
});
export type TSkillImport = z.infer<typeof ZSkillImport>;

export const ZQuestionSkillsParam = z.object({
  exerciseId: z.uuid(),
  questionId: z.coerce.number().int().positive()
});
export type TQuestionSkillsParam = z.infer<typeof ZQuestionSkillsParam>;

export const ZExerciseSkillsParam = z.object({
  exerciseId: z.uuid()
});

export const ZSetQuestionSkills = z.object({
  skillIds: z.array(z.uuid()).max(SKILL_QUESTION_LIMIT)
});
export type TSetQuestionSkills = z.infer<typeof ZSetQuestionSkills>;

export const ZSuggestSkills = z.object({
  courseId: z.uuid(),
  title: z.string().trim().min(1).max(2000),
  description: z.string().trim().max(4000).optional(),
  options: z.array(z.string().max(500)).max(20).optional(),
  limit: z.number().int().min(1).max(10).default(5)
});
export type TSuggestSkills = z.infer<typeof ZSuggestSkills>;

export const ZStudentMasteryParam = z.object({
  profileId: z.uuid()
});

export const ZPublicApiSkillsQuery = ZSkillListQuery.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
export type TPublicApiSkillsQuery = z.infer<typeof ZPublicApiSkillsQuery>;

export const SKILL_IMPORT_LIMITS = { maxRows: SKILL_IMPORT_MAX_ROWS } as const;
