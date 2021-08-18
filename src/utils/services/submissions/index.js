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
