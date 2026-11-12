import * as z from 'zod';

import { COURSE_TYPE_VALUES } from '../../constants/course-type';
import { COURSE_TEMPLATE_SOURCES } from './course-template';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const nullableTimestamp = z.string().nullable();

const source = z
  .enum(COURSE_TEMPLATE_SOURCES)
  .describe(
    "org = one of the organization's own templates, global = a curated template shared with every organization"
  );

export const ZPublicApiCourseTemplateListItemResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  type: z.enum(COURSE_TYPE_VALUES).nullable(),
  bannerImage: z.string().nullable(),
  source,
  createdAt: nullableTimestamp,
  lastUsedAt: nullableTimestamp.describe(
    'When the organization last created a course from this template; always null for global templates'
  )
});

const ZTemplateOutlineLesson = z.object({ id: z.string().uuid(), title: z.string() });

const ZTemplateOutlineExercise = z.object({
  id: z.string().uuid(),
  title: z.string(),
  questionCount: z.number()
});

export const ZPublicApiCourseTemplateResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  type: z.enum(COURSE_TYPE_VALUES).nullable(),
  bannerImage: z.string().nullable(),
  source,
  curated: z.boolean().describe('true for curated templates from the platform library'),
  counts: z.object({ sections: z.number(), lessons: z.number(), exercises: z.number() }),
  highlights: z
    .array(z.object({ title: z.string(), description: z.string().nullable() }))
    .describe('Selling points shown for global templates; empty for org templates'),
  settings: z
    .object({
      certificate: z.boolean(),
      deadline: z.string().nullable(),
      sequential: z.boolean(),
      grading: z.boolean(),
      commentsOff: z.boolean(),
      lessonDownload: z.boolean(),
      selfEnrollment: z.boolean(),
      aiTutor: z.boolean(),
      compliance: z.object({ months: z.number(), mandatory: z.boolean() }).nullable()
    })
    .describe('The settings a course created from this template starts with'),
  outline: z
    .array(
      z.object({
        id: z.string().describe('Section id, or standalone-<first item id> for items outside a section'),
        title: z.string().nullable().describe('null for items outside a section'),
        lessons: z.array(ZTemplateOutlineLesson),
        exercises: z.array(ZTemplateOutlineExercise)
      })
    )
    .describe('Sections in course order, with their lessons and exercises')
});
