import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them.
export const ZPublicApiStudentLessonCompletionResponse = z.object({
  lessonId: z.string().uuid(),
  memberId: z.string().uuid(),
  isComplete: z.boolean(),
  updatedAt: z.string().nullable()
});
