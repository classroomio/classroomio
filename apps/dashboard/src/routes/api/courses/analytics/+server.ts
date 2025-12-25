import type { CourseAnalytics, StudentOverview } from '$lib/utils/types/analytics';

import type { RequestHandler } from './$types';
import type { UserExercisesStats } from '$lib/utils/types/analytics';
import { calcPercentageWithRounding } from '$lib/utils/functions/number.js';
import { checkUserCoursePermissions } from '$lib/utils/functions/permissions';
import { fetchProfileCourseProgress } from '$lib/utils/services/courses';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';

const CACHE_DURATION = 60 * 5; // 5 minutes

export const GET: RequestHandler = async ({ setHeaders, request }) => {
  const userId = request.headers.get('user_id');
  if (!userId) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId');
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

    setHeaders({
      'cache-control': `max-age=${CACHE_DURATION}`,
      'content-type': 'application/json'
    });

    const analytics = await getCourseAnalytics(supabase, courseId);
    return json({ success: true, data: analytics });
  } catch (error) {
    console.error('Course analytics error:', error);
    return json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
};

async function getCourseAnalytics(supabase: any, courseId: string): Promise<CourseAnalytics> {
  const analytics: CourseAnalytics = {
    totalTutors: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalExercises: 0,
    lessonCompletionRate: 0,
    exerciseCompletionRate: 0,
    averageGrade: 0,
    students: []
  };

  // Fetch course basic info and group members
  const { data: courseData, error: courseError } = await supabase
    .from('course')
    .select(
      `
      id,
      title,
      group(
        members:groupmember(
          id,
          role_id,
          profile_id,
          profile(
            id,
            fullname,
            email,
            avatar_url
          )
        )
      ),
      lessons:lesson(
        id,
        title,
        exercise(id)
      )
    `
    )
    .eq('id', courseId)
    .single();

  if (courseError) {
    throw new Error('Failed to fetch course data');
  }

  // Count tutors and students
  const members = (courseData.group as any)?.members || [];
  analytics.totalTutors = members.filter((member) => member.role_id === 1 || member.role_id === 2).length;
  analytics.totalStudents = members.filter((member) => member.role_id === 3).length;

  // Count lessons and exercises
  analytics.totalLessons = courseData.lessons?.length || 0;
  analytics.totalExercises =
    courseData.lessons?.reduce((total, lesson) => total + (lesson.exercise?.length || 0), 0) || 0;

  // Get student analytics
  const studentAnalytics = await Promise.all(
    members.filter((member) => member.role_id === 3).map((member) => getStudentOverview(supabase, courseId, member))
  );

  analytics.students = studentAnalytics.filter((student): student is StudentOverview => student !== null);

  // Calculate aggregated metrics
  if (analytics.students.length > 0) {
    analytics.lessonCompletionRate = Math.round(
      analytics.students.reduce((sum, student) => sum + student.progressPercentage, 0) / analytics.students.length
    );

    analytics.exerciseCompletionRate = Math.round(
      analytics.students.reduce((sum, student) => {
        const completionRate =
          student.totalExercises > 0 ? (student.exercisesSubmitted / student.totalExercises) * 100 : 0;
        return sum + completionRate;
      }, 0) / analytics.students.length
    );

    analytics.averageGrade = Math.round(
      analytics.students.reduce((sum, student) => sum + student.averageGrade, 0) / analytics.students.length
    );
  }

  return analytics;
}

async function getLastLogin(supabase: any, userId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('analytics_login_events')
      .select('logged_in_at')
      .eq('user_id', userId)
      .order('logged_in_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data?.[0]?.logged_in_at;
  } catch (error) {
    console.error('Error fetching last login:', error);
    return undefined;
  }
}

async function getStudentOverview(supabase: any, courseId: string, member: any): Promise<StudentOverview | null> {
  try {
    // Use the same service function that the working analytics/user API uses
    const { data: courseProgressData, error: progressError } = await fetchProfileCourseProgress(
      courseId,
      member.profile_id
    );

    if (progressError) {
      console.error('Error fetching course progress:', progressError);
      return null;
    }

    const courseProgress = courseProgressData?.[0];
    if (!courseProgress) {
      console.error('No course progress data found');
      return null;
    }

    // Fetch exercise stats using the same method as the people page
    const userExercisesStats = await fetchUserExercisesStats(supabase, courseId, member.profile_id);

    // Calculate exercise completion using the same logic as people page
    const completedExercises = userExercisesStats?.filter((exercise) => exercise.isCompleted)?.length || 0;
    const totalExercises = userExercisesStats?.length || 0;

    // Get last login using the same approach as analytics/user API
    const lastLoginDate = await getLastLogin(supabase, member.profile_id);

    // Format last seen
    let lastSeen = 'Never';
    if (lastLoginDate) {
      const lastLogin = new Date(lastLoginDate);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        lastSeen = 'Just now';
      } else if (diffInHours < 24) {
        lastSeen = `${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        lastSeen = `${diffInDays} days ago`;
      }
    }

    // Calculate progress percentage
    const lessonsCompleted = courseProgress.lessons_completed || 0;
    const totalLessons = courseProgress.lessons_count || 0;
    const progressPercentage = calcPercentageWithRounding(lessonsCompleted, totalLessons);

    // Calculate average grade using the same logic as the people page
    const totalEarnedPoints = userExercisesStats?.reduce((sum, exercise) => sum + exercise.score, 0) || 0;
    const totalPoints = userExercisesStats?.reduce((sum, exercise) => sum + exercise.totalPoints, 0) || 0;
    const averageGrade = calcPercentageWithRounding(totalEarnedPoints, totalPoints);

    return {
      id: member.profile_id,
      profile: {
        fullname: member.profile?.fullname || 'Unknown',
        email: member.profile?.email || '',
        avatar_url: member.profile?.avatar_url || ''
      },
      lessonsCompleted,
      totalLessons,
      exercisesSubmitted: completedExercises,
      totalExercises: totalExercises,
      averageGrade,
      lastSeen,
      progressPercentage
    };
  } catch (error) {
    console.error('Error getting student overview:', error);
    return null;
  }
}

async function fetchUserExercisesStats(
  supabase: any,
  courseId: string,
  userId: string
): Promise<UserExercisesStats[] | undefined> {
  try {
    const { data: courseData, error: queryError } = await supabase
      .from('course')
      .select(
        `
        lesson!inner (
          title,exercise!inner (
            id,title,lesson_id,created_at,question (points),
            submission!left (
              id,total,status_id,submitted_by,groupmember!inner (id,profile_id)
            )
          )
        )
      `
      )
      .eq('lesson.exercise.submission.groupmember.profile_id', userId)
      .eq('id', courseId);

    if (queryError) {
      console.error('Error fetching exercise data:', queryError);
      return;
    }

    if (!courseData || courseData.length === 0) {
      return;
    }

    const userExercisesStats = courseData[0].lesson.flatMap(
      (lesson) =>
        lesson.exercise?.map((exercise) => {
          const totalPoints = exercise.question?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
          const userSubmission = exercise.submission?.[0];

          return {
            id: exercise.id,
            lessonId: exercise.lesson_id,
            lessonTitle: lesson.title,
            title: exercise.title,
            status: userSubmission?.status_id,
            score: userSubmission?.total || 0,
            totalPoints,
            isCompleted: !!userSubmission
          };
        }) || []
    );

    return userExercisesStats;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}
