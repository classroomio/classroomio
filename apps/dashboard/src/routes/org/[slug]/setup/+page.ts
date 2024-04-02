import { getSupabase } from '$lib/utils/functions/supabase';
import get from 'lodash/get';

const supabase = getSupabase();

async function getGenericData(
  orgSlug: string
): Promise<{ isCoursePublished: boolean; isCourseCreated: boolean; orgHasAvatarUrl: boolean }> {
  const { data } = await supabase
    .from('course')
    .select(
      `
    id,
    is_published,
    group:group_id!inner(
      organization!inner(
        avatar_url,
        siteName
      )
    )
  `
    )
    .eq('group.organization.siteName', orgSlug);

  const result = data || [];

  console.log({ result });

  return {
    isCoursePublished: result.find((c) => !!c.is_published),
    isCourseCreated: result.length > 0,
    orgHasAvatarUrl: !!get(result[0], 'group.organization.avatar_url', '')
  };
}

async function getIsLessonCreated(orgSlug: string): Promise<boolean> {
  const { data } = await supabase
    .from('lesson')
    .select(
      `
    id,
    course:course_id!inner(
      group:group_id!inner(
        organization!inner(
          siteName
        )
      )
    )
  `
    )
    .eq('course.group.organization.siteName', orgSlug);
  return data?.length > 0;
}

async function getIsExerciseCreated(orgSlug: string): Promise<boolean> {
  const { data } = await supabase
    .from('exercise')
    .select(
      `
    id,
    lesson:lesson_id!inner(
      course:course_id!inner(
        group:group_id!inner(
          organization!inner(
            siteName
          )
        )
      )
    )
  `
    )
    .eq('lesson.course.group.organization.siteName', orgSlug);
  return data?.length > 0;
}

export const load = async ({ params = { slug: '' } }) => {
  const { isCourseCreated, isCoursePublished, orgHasAvatarUrl } = await getGenericData(params.slug);
  const isLessonCreated = await getIsLessonCreated(params.slug);
  const isExerciseCreated = await getIsExerciseCreated(params.slug);

  const data = [
    {
      id: 'profile',
      title: 'Upload a profile picture and update username',
      desc: 'Personalize and a human touch making interactions more personal and memorable',
      is_completed: false,
      button_label: 'Update Profile'
    },
    {
      id: 'organization',
      title: 'Update organisation profile picture',
      desc: 'Establish a professional and recognizable identity for your organization',
      is_completed: orgHasAvatarUrl,
      button_label: 'Update Org Profile'
    },
    {
      id: 'course',
      title: 'Create Course',
      desc: 'Create a course that you will share with your students',
      is_completed: isCourseCreated,
      button_label: 'Create Course'
    },
    {
      id: 'lesson',
      title: 'Create a lesson',
      desc: 'Break your course into lesson that your students can easily understand',
      is_completed: isLessonCreated,
      button_label: 'Create Lesson'
    },
    {
      id: 'exercise',
      title: 'Create an exercise',
      desc: 'Test your students allow them to demonstarte their understanding of the subject matter',
      is_completed: isExerciseCreated,
      button_label: 'Create Assignment'
    },
    {
      id: 'publish',
      title: 'Publish a course',
      desc: 'Make your course public and purchaseable ',
      is_completed: isCoursePublished,
      button_label: 'Publish Course'
    }
  ];

  return {
    orgSiteName: params.slug,
    setup: data
  };
};
