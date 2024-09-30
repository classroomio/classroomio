import { supabase } from '$lib/utils/functions/supabase';
import type { ExerciseSubmissions } from '$lib/utils/types';

export function fetchSubmissionStatus() {
  return supabase.from('submissionstatus').select(`*`);
}

export function fetchSubmissions(course_id: string) {
  return supabase
    .from('submission')
    .select(
      `
    id,
    created_at,
    answers:question_answer(*),
    exercise:exercise_id(
      id, title, due_by,
      lesson:lesson_id(id, title),
      questions:question(
        *,
        options:option(*),
        question_type:question_type_id(id, label)
      )
    ),
    status_id,
    feedback,
    course:course_id(*),
    groupmember:submitted_by(
      profile(*)
    )
  `
    )
    .match({
      course_id
    });
}

export async function fetchSubmission({
  courseId,
  exerciseId,
  submittedBy
}: {
  exerciseId: string;
  courseId?: string;
  submittedBy?: string;
}) {
  const query: {
    exercise_id: string;
    course_id?: string;
    submitted_by?: string;
  } = {
    exercise_id: exerciseId
  };

  if (courseId) {
    query.course_id = courseId;
  }
  if (submittedBy) {
    query.submitted_by = submittedBy;
  }

  return supabase
    .from('submission')
    .select(
      `
      id,
      answers:question_answer(*),
      status_id,
      feedback,
      submitted_by:groupmember!inner(
        profile!inner(
          id,
          fullname,
          avatar_url
        )
      )
    `
    )
    .match(query)
    .returns<ExerciseSubmissions[]>();
}

export async function updateSubmission(
  {
    id,
    status_id,
    total,
    feedback
  }: { id: string; status_id?: number; total?: number; feedback?: string },
  otherArgs?: Record<string, string>
) {
  const toUpdate: {
    status_id?: number;
    total?: number;
    feedback?: string;
  } = {
    status_id,
    feedback
  };

  if (typeof total === 'number') {
    toUpdate.total = total;
  }

  return supabase.from('submission').update(toUpdate, otherArgs).match({ id });
}

export async function deleteSubmission(id: string) {
  return supabase.from('submission').delete().match({ id });
}

export async function updateQuestionAnswer(
  update: Record<string, string>,
  match: Record<string, string>
) {
  return supabase.from('question_answer').update(update).match(match);
}
