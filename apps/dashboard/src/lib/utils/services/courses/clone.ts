import type { Course, Lesson, Profile } from '$lib/utils/types';

import type { PostgrestError } from '@supabase/supabase-js';
// @ts-ignore
import { QUESTION_TYPE } from '$lib/components/Question/constants';
// @ts-ignore
import { ROLE } from '$lib/utils/constants/roles';
// @ts-ignore
import { addGroupMember } from './index';
import { get } from 'svelte/store';
// @ts-ignore
import { profile } from '$lib/utils/store/user';
import { supabase } from '$lib/utils/functions/supabase';

type GetCourseResponse = {
  data: Course;
  error: PostgrestError | null;
};

async function fetchCourseData(courseId: string): Promise<GetCourseResponse> {
  const { data, error } = await supabase
    .from('course')
    .select(
      `
      *,
      lessons:lesson(
        *,
        exercise:id(
          id, title, description, due_by,
          questions:question(
            *,
            options:option(*),
            question_type:question_type_id(id, label)
          )
        )
      )
    `
    )
    .match({ id: courseId })
    .single();

  return { data, error };
}

async function cloneGroupAndBasicCourse(
  course: Course,
  newTitle: string
): Promise<{ newCourse: Course }> {
  const { description } = course;

  const { data: newGroup } = await supabase
    .from('group')
    .insert({ name: newTitle, description })
    .select();

  console.log(`newGroup`, newGroup);
  if (!Array.isArray(newGroup)) {
    throw new Error('Group wasnt created successfully');
  }

  const { id: group_id } = newGroup[0];

  // 2. Create course with group_id
  const { data: newCourse } = await supabase
    .from('course')
    .insert({
      ...course,
      title: newTitle,
      description,
      group_id,
      lessons: undefined,
      id: undefined,
      updated_at: undefined,
      created_at: undefined
    })
    .select();

  console.log(`newCourse`, newCourse);

  // 3. Add group members

  const profileStoreValue: Profile = get(profile);

  // Get profile of author and add as member
  await addGroupMember({
    profile_id: profileStoreValue.id,
    email: profileStoreValue.email,
    group_id,
    role_id: ROLE.TUTOR
  });

  console.log('profileStoreValue', profileStoreValue);

  return {
    newCourse: newCourse?.[0]
  };
}

async function cloneLessons(lessons: Lesson[], courseId: Course['id']) {
  const clonedLessons = lessons
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
    .map((lesson, index) => ({
      call_url: lesson.call_url,
      course_id: courseId,
      is_unlocked: lesson.is_unlocked,
      lesson_at: new Date(),
      note: lesson.note,
      order: lesson.order || index + 1,
      public: lesson.public,
      slide_url: lesson.slide_url,
      title: lesson.title,
      videos: lesson.videos
    }));

  const { data } = await supabase.from('lesson').insert(clonedLessons).select();

  const newLessons = data?.map((dataItem, dataIndex) => {
    return {
      ...dataItem,
      // @ts-ignore
      exercise: lessons[dataIndex].exercise
    };
  });

  console.log('newLessons', newLessons);
  return { newLessons };
}

async function cloneExercises(lessons: Lesson[]) {
  console.log('lessons', lessons);

  // Lessons
  for (const lesson of lessons) {
    // @ts-ignore
    const { id: lessonId, exercise = [] } = lesson;

    // Exercises
    for (const exerciseItem of exercise) {
      const { title, description, questions = [] } = exerciseItem;
      // Insert
      const { data } = await supabase
        .from('exercise')
        .insert({
          description,
          due_by: new Date(),
          lesson_id: lessonId,
          title
        })
        .select();
      const newExercise = Array.isArray(data) ? data[0] : data;
      console.log('newExercise', newExercise);

      // Questions
      for (const question of questions) {
        const { options = [] } = question;

        // Insert
        const { data } = await supabase
          .from('question')
          .insert({
            name: question.name,
            title: question.title,
            points: question.points,
            order: question.order,
            question_type_id: question.question_type_id,
            exercise_id: newExercise.id
          })
          .select();
        const newQuestion = Array.isArray(data) ? data[0] : data;
        console.log('newQuestion', newQuestion);

        // Options: Don't map options for 'Paragraph' questions
        if (QUESTION_TYPE.TEXTAREA !== newQuestion.question_type_id) {
          // @ts-ignore
          const newOptions = options.map((option) => ({
            value: option.value,
            label: option.label,
            is_correct: option.is_correct,
            question_id: newQuestion.id
          }));

          // Insert[Batch]
          await supabase.from('option').insert(newOptions).select();
        }
      }
    }
  }

  return true;
}

export async function cloneCourse(courseId: string, newTitle: string): Promise<Course> {
  const { data: course, error } = await fetchCourseData(courseId);
  console.log(`course`, course);

  if (error) {
    console.error('Error when cloning', error);
    throw error;
  }

  /**
   * 1. Copy course table
   * 2. Copy lessons table (NOTE: Copy sections table here)
   * 3. Copy exercises table
   * 4. Copy questions table
   * 5. Copy options table
   */

  // tables: group, groupmember, course(group_id)
  const { newCourse } = await cloneGroupAndBasicCourse(course, newTitle);
  console.log('returned -> newCourse', newCourse);

  // @ts-ignore
  const { newLessons } = await cloneLessons(course.lessons, newCourse.id);
  console.log('returned -> newLessons', newLessons);

  const cloneExercisesRes = await cloneExercises(newLessons || []);
  console.log('returned -> cloneExercisesRes', cloneExercisesRes);

  return newCourse;
}

/*

1. Click on 3 dots to clone course

2. Show a modal with a new name "Copy of previous course name"

-> Note the following information will be copied

3. Things to copy
Lessons
Exercises - questions, options, everything basically.

Technical approach
- Fetch all the data to the client
- Manually call functions to create

- call a psql function with newname, course_id

- copy all in course table
- copy all in group table by course_id
- add only one group member as admin

- get all lessons in course
- copy each one with unique ids

- get all exercises by course id
- copy exercise

- get questions
- copy questions

- get options
- copy options
*/
