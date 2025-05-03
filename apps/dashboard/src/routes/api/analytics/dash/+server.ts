import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import type { OrganisationAnalytics } from '$lib/utils/types/analytics';
import { json } from '@sveltejs/kit';

const supabase = getServerSupabase();

const CACHE_DURATION = 60 * 5; // 5 minutes

export async function POST({ setHeaders, request }) {
  const { orgId } = await request.json();

  if (!orgId) {
    return json({ success: false, message: 'Request is missing required fields' }, { status: 400 });
  }

  setHeaders({
    'cache-control': `max-age=${CACHE_DURATION}`,
    'content-type': 'application/json'
  });

  try {
    const analytics = await getOrganisationAnalytics(orgId);

    return json(analytics, { status: 200 });
  } catch (error) {
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
}

async function getOrganisationAnalytics(orgId: string): Promise<OrganisationAnalytics> {
  const analytics: OrganisationAnalytics = {
    revenue: 0,
    numberOfCourses: 0,
    totalStudents: 0,
    topCourses: [],
    enrollments: []
  };
  // Run all queries in parallel
  const [statsResult, topCoursesResult, enrollmentsResult] = await Promise.all([
    supabase.from('dash_org_stats').select('*').eq('org_id', orgId),

    supabase
      .rpc('get_dash_org_top_courses', {
        org_id_arg: orgId
      })
      .order('completion_percentage', { ascending: false }),

    supabase.rpc('get_dash_org_recent_enrollments', {
      org_id_arg: orgId
    })
  ]);

  // Check for errors
  if (statsResult.error) {
    console.error(statsResult.error);
    throw new Error('Failed to fetch organisation analytics');
  }
  if (topCoursesResult.error) {
    console.error(topCoursesResult.error);
    throw new Error('Failed to fetch top courses');
  }
  if (enrollmentsResult.error) {
    console.error(enrollmentsResult.error);
    throw new Error('Failed to fetch enrollments');
  }

  // Set analytics data
  analytics.revenue = 0; // Hardcode until we implement payment
  analytics.numberOfCourses = statsResult.data?.[0]?.no_of_courses;
  analytics.totalStudents = statsResult.data?.[0]?.enrolled_students;

  analytics.topCourses = topCoursesResult.data.map((course) => ({
    id: course.course_id,
    title: course.course_title,
    enrollments: course.total_students,
    completion: course.completion_percentage
  }));

  analytics.enrollments = enrollmentsResult.data.map((enrollment) => ({
    id: enrollment.profile_id,
    avatarUrl: enrollment.avatar_url,
    name: enrollment.fullname,
    courseId: enrollment.course_id,
    course: enrollment.course_title,
    date: enrollment.enrolled_at
  }));

  return analytics;
}
