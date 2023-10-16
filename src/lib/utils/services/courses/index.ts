import { supabase } from '$lib/utils/functions/supabase';
import { isUUID } from '$lib/utils/functions/isUUID';
import { QUESTION_TYPE } from '$lib/components/Question/constants';
import type {
  Lesson,
  Course,
  Group,
  Groupmember,
  Exercise,
  LessonCompletion,
  ExerciseTemplate
} from '$lib/utils/types';
import { STATUS } from '$lib/utils/constants/course';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export async function fetchCourse(courseId?: Course['id'], slug?: Course['slug']) {
  let match: { slug?: string; id?: string; status?: string } = {};

  if (slug) {
    match.slug = slug;
  } else {
    match.id = courseId;
  }

  match.status = STATUS[STATUS.ACTIVE];

  const response: PostgrestSingleResponse<Course | null> = await supabase
    .from('course')
    .select(
      `
      id,
      title,
      description,
      overview,
      logo,
      group(*,
        members:groupmember(*,
          profile(*)
        )
      ),
      slug,
      cost,
      currency,
      metadata,
      is_certificate_downloadable,
      certificate_theme,
      lessons:lesson(
        id, title,public, lesson_at, call_url, is_unlocked, order, created_at,
        note, videos, slide_url, call_url, totalExercises:exercise(count), totalComments:lesson_comment(count),
        profile:teacher_id(id, avatar_url, fullname),
        lesson_completion(id, profile_id, is_complete)
      ),
      attendance:group_attendance(*)
    `
    )
    .match(match)
    .single();

  const { data, error } = response;

  console.log(`error`, error);
  if (!data || error) {
    console.log(`data`, data);
    console.log(`fetchCourse => error`, error);
    // return this.redirect(301, '/courses');
    return { data, error };
  }

  return {
    data,
    error
  };
}

export async function fetchGroup(groupId: Group['id']) {
  const { data, error } = await supabase
    .from('group')
    .select(`*,members:groupmember(*,profile(*))`)
    .match({ id: groupId })
    .single();

  return {
    data,
    error
  };
}

export async function uploadAvatar(courseId: string, avatar: string) {
  const filename = `course/${courseId + Date.now()}.webp`;
  let logo;

  const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
    cacheControl: '3600',
    upsert: false
  });

  if (data) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(filename);

    if (!data.publicUrl) return;

    logo = data.publicUrl;
  }

  return logo;
}

export async function updateCourse(
  courseId: Course['id'],
  avatar: string | undefined,
  course: Course
) {
  if (avatar && courseId) {
    const filename = `course/${courseId + Date.now()}.webp`;

    const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
      cacheControl: '3600',
      upsert: false
    });

    if (data) {
      const { data: response } = supabase.storage.from('avatars').getPublicUrl(filename);

      if (!response.publicUrl) return;

      course.logo = response.publicUrl;
    }
  }

  await supabase.from('course').update(course).match({ id: courseId });

  return course.logo;
}

export async function deleteCourse(courseId: Course['id']) {
  return await supabase.from('course').update({ status: 'DELETED' }).match({ id: courseId });
}

export function addGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}

export function updatedGroupMember(update: any, match: any) {
  return supabase.from('groupmember').update(update).match(match);
}

export function deleteGroupMember(groupMemberId: Groupmember['id']) {
  return supabase.from('groupmember').delete().match({ id: groupMemberId });
}

export function fetchLesson(lessonId: Lesson['id']) {
  return supabase
    .from('lesson')
    .select(
      `id, note, videos, slide_url, call_url, totalExercises:exercise(count), totalComments:lesson_comment(count), lesson_completion(id, profile_id, is_complete)`
    )
    .eq('id', lessonId)
    .single();
}

export function createLesson(lesson: any) {
  return supabase.from('lesson').insert(lesson).select();
}

export function updateLesson(lesson: any, lessonId: Lesson['id']) {
  return supabase
    .from('lesson')
    .update({ ...lesson, id: undefined })
    .match({ id: lessonId });
}

export function updateLessonCompletion(completion: LessonCompletion) {
  return supabase.from('lesson_completion').upsert(completion);
}

export function deleteLesson(lessonId: Lesson['id']) {
  // Need to implement soft delete
  return supabase.from('lesson').delete().match({ id: lessonId });
}

export function createExercise(exercise: any) {
  return supabase.from('exercise').insert(exercise).select();
}

export function fetchExercisesByMarks(courseId: Course['id']) {
  return supabase.rpc('get_exercises').eq('course_id', courseId);
}

function isNew(item: any) {
  return isNaN(item);
}

export async function createExerciseFromTemplate(
  lessonId: string,
  template: ExerciseTemplate
): Promise<any | undefined> {
  const { data, error } = await createExercise({
    title: template.title,
    description: template.description,
    lesson_id: lessonId
  });

  if (error) {
    console.error('Something went wrong', error);
    return;
  }

  const { id } = data[0] || {};
  if (!id) {
    console.error('Something went wrong, no id', error);
    return;
  }

  await upsertExercise(template.questionnaire, id);

  return data[0];
}

export async function upsertExercise(questionnaire: any, exerciseId: Exercise['id']) {
  const {
    questions,
    title,
    description,
    due_by,
    is_title_dirty,
    is_description_dirty,
    is_due_by_dirty
  } = questionnaire;

  if (is_description_dirty || is_title_dirty || is_due_by_dirty) {
    await supabase
      .from('exercise')
      .update({
        title,
        description,
        due_by
      })
      .match({ id: exerciseId });
  }

  const updatedQuestions = [];

  for (const question of questions) {
    const { title, id, name, question_type, options, deleted_at, order, points, is_dirty } =
      question;

    // "DELETE" /delete/:questionId - Don't delete if answer already given
    if (deleted_at) {
      // Delete from server only if this question exists in the database
      if (!isNew(id)) {
        await supabase.from('option').delete().match({ question_id: id });
        await supabase.from('question_answer').delete().match({ question_id: id });
        const { error } = await supabase.from('question').delete().match({ id });

        if (error) {
          console.error('Cannot delete this question', error);
          continue;
        }
      }

      // Skip the remaining operation so we filter out this question from the new questions array
      continue;
    }

    // "INSERT" or "UPDATE" /update/:questionId or /insert/:questionId
    const newQuestion = {
      id: isNew(id) ? undefined : id,
      name: isNew(id) ? undefined : name,
      title,
      points,
      order,
      question_type_id: question_type.id,
      exercise_id: exerciseId
    };
    let questionSupabaseRes;

    if (is_dirty || isNew(id)) {
      const res = await supabase.from('question').upsert(newQuestion).select();

      if (res.error) {
        console.error(`Upsert question`, res.error);
      }
      questionSupabaseRes = Array.isArray(res.data) ? res.data[0] : null;
    } else {
      questionSupabaseRes = Object.assign(newQuestion);
    }

    if (questionSupabaseRes) {
      const { question_type_id, id, name, order } = questionSupabaseRes;

      // Delete cause this is not a field in the table
      delete newQuestion.question_type_id;

      // @ts-ignore
      newQuestion.question_type = { id: question_type_id, label: question_type.label || '' };
      newQuestion.id = id;
      newQuestion.name = name;
      newQuestion.order = order;
      // @ts-ignore
      newQuestion.options = [];

      // Don't map options for 'Paragraph' questions
      if (QUESTION_TYPE.TEXTAREA !== question_type_id) {
        for (const option of options) {
          const { deleted_at, is_dirty } = option;

          // "DELETE" /delete/:optionId
          if (deleted_at) {
            // if this option exists in the database
            if (!isNew(option.id)) {
              supabase.from('option').delete().match({ id: option.id });
            }

            // Skip the remaining operation so we filter out this option from the new option array
            continue;
          }

          // "INSERT" and "UPDATE"
          const newOption = {
            ...option,
            is_dirty: undefined,
            id: isNew(option.id) ? undefined : option.id,
            value: isUUID(option.value) ? option.value : undefined, // this value is of UUID type
            question_id: newQuestion.id
          };

          if (is_dirty || isNew(option.id)) {
            const { data } = await supabase.from('option').upsert(newOption).select();
            if (Array.isArray(data)) {
              // @ts-ignore
              newQuestion.options.push(data[0]);
            }
          } else {
            // @ts-ignore
            newQuestion.options.push(newOption);
          }
        }
      }

      updatedQuestions.push(newQuestion);
    }
  }

  return updatedQuestions;
}

interface LooseObject {
  [key: string]: any;
}

export async function submitExercise(
  answers: Array<string>,
  questions: Array<{ name: string; id: string }>,
  exerciseId: Exercise['id'],
  courseId: Course['id'],
  groupMemberId: Groupmember['id'] | undefined
) {
  if (!groupMemberId) {
    return;
  }

  const questionsByName = questions.reduce(
    (acc, q) => ({ ...acc, [q.name]: q.id }),
    {}
  ) as LooseObject;
  const questionAnswers = [];

  const { data: submission } = await supabase
    .from('submission')
    .insert({
      submitted_by: groupMemberId,
      exercise_id: exerciseId,
      course_id: courseId
    })
    .select();

  for (const questionName in answers) {
    const value = answers[questionName];

    const questionAnswer = {
      group_member_id: groupMemberId,
      question_id: questionsByName[questionName],
      open_answer: '',
      answers: [],
      submission_id: Array.isArray(submission) ? submission[0].id : null
    };

    if (typeof value === 'string') {
      questionAnswer.open_answer = value;
    } else {
      questionAnswer.answers = value;
    }

    questionAnswers.push(questionAnswer);
  }

  const res = await supabase.from('question_answer').insert(questionAnswers).select();
  console.log(`res`, res);
}

export async function deleteExercise(questions: Array<{ id: string }>, exerciseId: Exercise['id']) {
  for (const question of questions) {
    const { id } = question;

    await supabase.from('option').delete().match({ question_id: id });
    await supabase.from('question_answer').delete().match({ question_id: id });

    await supabase.from('question').delete().match({ id });
  }

  await supabase.from('submission').delete().match({ exercise_id: exerciseId });
  await supabase.from('exercise').delete().match({ id: exerciseId });
}
