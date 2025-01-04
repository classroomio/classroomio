import { getSupabase } from '$lib/utils/functions/supabase';
import get from 'lodash/get';

const supabase = getSupabase();

async function getGenericData(orgSlug: string): Promise<{
  isCoursePublished: boolean;
  isCourseCreated: boolean;
  orgHasAvatarUrl: boolean;
  courseData: any;
}> {
  const { data: publishedCourse } = await supabase
    .from('course')
    .select(
      `
    is_published,
    group:group_id!inner(
      organization!inner(
        siteName
      )
    )
  `
    )
    .eq('is_published', true)
    .eq('group.organization.siteName', orgSlug)
    .limit(1)
    .returns<{ is_published: boolean }>();

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
    .eq('group.organization.siteName', orgSlug)
    .limit(1);

  const result = data || [];

  return {
    isCoursePublished: publishedCourse?.is_published === true,
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
    .eq('course.group.organization.siteName', orgSlug)
    .limit(1);
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
    .eq('lesson.course.group.organization.siteName', orgSlug)
    .limit(1);

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
      title: 'setup.personal_profile.title',
      desc: 'setup.personal_profile.desc',
      is_completed: false,
      button_label: 'setup.personal_profile.button_label'
    },
    {
      id: 'organization',
      title: 'setup.organization_profile.title',
      desc: 'setup.organization_profile.desc',
      is_completed: orgHasAvatarUrl,
      button_label: 'setup.organization_profile.button_label'
    },
    {
      id: 'course',
      title: 'setup.course.title',
      desc: 'setup.course.desc',
      is_completed: isCourseCreated,
      button_label: 'setup.course.button_label'
    },
    {
      id: 'lesson',
      title: 'setup.lesson.title',
      desc: 'setup.lesson.desc',
      is_completed: isLessonCreated,
      button_label: 'setup.lesson.button_label'
    },
    {
      id: 'exercise',
      title: 'setup.exercise.title',
      desc: 'setup.exercise.desc',
      is_completed: isExerciseCreated,
      button_label: 'setup.exercise.button_label'
    },
    {
      id: 'publish',
      title: 'setup.publish_course.title',
      desc: 'setup.publish_course.desc',
      is_completed: isCoursePublished,
      button_label: 'setup.publish_course.button_label'
    }
  ];

  return {
    orgSiteName: params.slug,
    setup: data,
    courses: courseData,
    lessons: lessonData
  };
};
