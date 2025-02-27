import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const supabase = getServerSupabase();
  const courseId = request.headers.get('courseId');
  const { courseTitle, profileId } = await request.json();

  console.log('Received request with:', { courseId, courseTitle, profileId });

  if (!courseId || !courseTitle || !profileId) {
    return json(
      {
        error: 'Missing required parameters',
        params: { courseId, courseTitle, profileId }
      },
      { status: 400 }
    );
  }

  // get the course and its group_id
  const { data: courseCheck } = await supabase
    .from('course')
    .select('id, group_id')
    .eq('id', courseId);

  if (!courseCheck || courseCheck.length === 0) {
    console.log('Course not found');
    return null;
  }

  // get the group to find its organization_id
  const { data: groupCheck } = await supabase
    .from('group')
    .select('id, organization_id')
    .eq('id', courseCheck[0].group_id);

  if (!groupCheck || groupCheck.length === 0) {
    console.log('Group not found');
    return null;
  }

  const organizationId = groupCheck[0].organization_id;

  // get the user's organization memberships
  const { data: memberCheck } = await supabase
    .from('organizationmember')
    .select('*')
    .eq('profile_id', profileId);

  console.log('memberCheck', memberCheck);

  // check if the user is a member of the required organization
  const isMember =
    memberCheck && memberCheck.some((membership) => membership.organization_id === organizationId);

  console.log('Is member of the required organization:', isMember);

  if (!isMember) {
    return json({ error: 'User is not a member of the organization' }, { status: 401 });
  }

  if (!isMember) {
    return;
  }

  const { data, error } = await supabase.rpc('clone_course', {
    input_course_id: courseId,
    new_title: courseTitle,
    input_profile_id: profileId
  });

  if (error) {
    console.log('error', error);
    return json({ error: 'Error cloning course' });
  }

  return json(data);
}
