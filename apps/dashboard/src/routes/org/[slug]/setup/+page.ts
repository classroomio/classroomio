import { getSupabase } from '$lib/utils/functions/supabase';
import get from 'lodash/get';

const supabase = getSupabase();

async function getGenericData(orgSlug: string): Promise<{
  isCoursePublished: boolean;
  isCourseCreated: boolean;
  orgHasAvatarUrl: boolean;
  courseData: any;
}> {
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

  console.log('courseData', result);

  return {
    isCoursePublished: result.some((c) => c.is_published === true),
    isCourseCreated: result.length > 0,
    orgHasAvatarUrl: !!get(result[0], 'group.organization.avatar_url', ''),
    courseData: result
  };
}

async function getIsLessonCreated(
  orgSlug: string
): Promise<{ isLessonCreated: boolean; lessonData: any }> {
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
  console.log('lessonsData', data);

  return {
    isLessonCreated: Array.isArray(data) ? data.length > 0 : false,
    lessonData: data
  };
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

  return Array.isArray(data) ? data?.length > 0 : false;
}

export const load = async ({ params = { slug: '' } }) => {
  const { isCourseCreated, isCoursePublished, orgHasAvatarUrl, courseData } = await getGenericData(
    params.slug
  );
  const { isLessonCreated, lessonData } = await getIsLessonCreated(params.slug);
  const isExerciseCreated = await getIsExerciseCreated(params.slug);

  const data = [
    {
      id: 'profile',
      title: 'setup.1.title',
      desc: 'setup.1.desc',
      is_completed: false,
      button_label: 'setup.1.button_label'
    },
    {
      id: 'organization',
      title: 'setup.2.title',
      desc: 'setup.2.desc',
      is_completed: orgHasAvatarUrl,
      button_label: 'setup.2.button_label'
    },
    {
      id: 'course',
      title: 'setup.3.title',
      desc: 'setup.4.desc',
      is_completed: isCourseCreated,
      button_label: 'setup.3.button_label'
    },
    {
      id: 'lesson',
      title: 'setup.4.title',
      desc: 'setup.4.desc',
      is_completed: isLessonCreated,
      button_label: 'setup.4.button_label'
    },
    {
      id: 'exercise',
      title: 'setup.5.title',
      desc: 'setup.5.desc',
      is_completed: isExerciseCreated,
      button_label: 'setup.5.button_label'
    },
    {
      id: 'publish',
      title: 'setup.6.title',
      desc: 'setup.6.desc',
      is_completed: isCoursePublished,
      button_label: 'setup.6.button_label'
    }
  ];

  return {
    orgSiteName: params.slug,
    setup: data,
    courses: courseData,
    lessons: lessonData
  };
};
