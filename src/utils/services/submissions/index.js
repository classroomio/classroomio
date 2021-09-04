import { supabase } from '../../functions/supabase';

export function fetchSubmissionStatus() {
  return supabase.from('submissionstatus').select(`*`);
}

export function fetchSubmissions(course_id) {
  return supabase
    .from('submission')
    .select(
      `
    id,
    answers:question_answer(*),
    exercise:exercise_id(
      id, title,
      lesson:lesson_id(id, title),
      questions:question(
        *,
        options:option(*),
        question_type:question_type_id(id, label)
      )
    ),
    status_id,
    course:course_id(*),
    groupmember:submitted_by(
      profile(*)
    )
  `
    )
    .match({
      course_id,
    });
}

export async function fetchSubmission({ courseId, exerciseId, submittedBy }) {
  return supabase
    .from('submission')
    .select(
      `
      id,
      answers:question_answer(*),
      status_id
    `
    )
    .match({
      submitted_by: submittedBy,
      exercise_id: exerciseId,
      course_id: courseId,
    });
}

export async function updateSubmission({ id, status_id, total }) {
  const toUpdate = {
    status_id,
  };

  if (typeof total === 'number') {
    toUpdate.total = total;
  }

  return supabase.from('submission').update(toUpdate).match({ id });
}

export async function updateQuestionAnswer(update, match) {
  return supabase.from('question_answer').update(update).match(match);
}
