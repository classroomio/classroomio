import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { checkUserCoursePermissions } from '$lib/utils/functions/permissions';

export const GET: RequestHandler = async ({ request, url }) => {
  const exerciseId = url.searchParams.get('exerciseId');
  const courseId = url.searchParams.get('courseId');
  const submittedBy = url.searchParams.get('submittedBy');
  const userId = request.headers.get('user_id');

  if (!userId) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!exerciseId) {
    return json({ success: false, message: 'Exercise ID is required' }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();

    // If courseId is provided, check permissions
    if (courseId) {
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
    }

    // Build query object
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

    // Fetch submission
    const { data, error } = await supabase
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
      .match(query);

    if (error) {
      throw new Error('Error fetching submission');
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
