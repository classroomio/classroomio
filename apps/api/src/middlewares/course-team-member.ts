import { Context, Next } from 'hono';
import { getSupabase } from '$src/utils/supabase';
import type { User } from '@supabase/supabase-js';

type Variables = { user: User };

export const courseTeamMemberMiddleware = async (
  c: Context<{ Variables: Variables }>,
  next: Next
) => {
  const courseId = c.req.param('courseId');
  const user = c.get('user');

  if (!courseId) {
    return c.json({ success: false, message: 'Missing courseId' }, 400);
  }

  if (!user) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase();

    // Get the group_id for this course
    const { data: course, error: courseError } = await supabase
      .from('course')
      .select('group_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return c.json({ success: false, message: 'Course not found' }, 404);
    }

    // Check if user is ADMIN (1) or TUTOR (2) in the course's group
    const { data: membership, error: memberError } = await supabase
      .from('groupmember')
      .select('role_id')
      .eq('group_id', course.group_id)
      .eq('profile_id', user.id)
      .in('role_id', [1, 2])
      .maybeSingle();

    if (memberError) {
      console.error('courseTeamMemberMiddleware membership error:', memberError);
      return c.json({ success: false, message: 'Failed to verify permissions' }, 500);
    }

    if (!membership) {
      return c.json(
        { success: false, message: 'You do not have permission to access this course' },
        403
      );
    }

    await next();
  } catch (error) {
    console.error('courseTeamMemberMiddleware unexpected error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};
