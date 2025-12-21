import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { checkUserCoursePermissions } from '$lib/utils/functions/permissions';

export const GET: RequestHandler = async ({ request, url }) => {
  const courseId = url.searchParams.get('courseId');
  const userId = request.headers.get('user_id');

  if (!userId) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!courseId) {
    return json({ success: false, message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();

    const hasPermission = await checkUserCoursePermissions(supabase, userId, courseId);

    if (!hasPermission) {
      return json(
        {
          success: false,
          message: 'Access denied. User is not a member of this course or organization.'
        },
        { status: 403 }
      );
    }

    // Fetch submissions
    const { data, error } = await supabase
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
        course_id: courseId
      });

    if (error) {
      throw new Error('Error fetching submissions');
    }

    return json({
      success: true,
      data: data || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return json(
      {
        success: false,
        message
      },
      { status: 500 }
    );
  }
};
