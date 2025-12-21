import { supabase, getAccessToken } from '$lib/utils/functions/supabase';
import type { ExerciseSubmissions } from '$lib/utils/types';

export function fetchSubmissionStatus() {
  return supabase.from('submissionstatus').select(`*`);
}

export async function fetchSubmissions(course_id: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`/api/courses/submissions?courseId=${course_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken
    }
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      data: null,
      error: { message: error }
    };
  }

  const { success, data, message } = await response.json();

  if (!success) {
    return {
      data: null,
      error: { message }
    };
  }

  return { data, error: null };
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
  const accessToken = await getAccessToken();

  const params = new URLSearchParams({ exerciseId });
  if (courseId) params.append('courseId', courseId);
  if (submittedBy) params.append('submittedBy', submittedBy);

  const response = await fetch(`/api/courses/submission?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken
    }
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      data: null,
      error: { message: error }
    };
  }

  const { success, data, message } = await response.json();

  if (!success) {
    return {
      data: null,
      error: { message }
    };
  }

  return { data, error: null };
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
