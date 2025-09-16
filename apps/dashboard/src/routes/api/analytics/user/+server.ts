import type {
  UserAnalytics,
  UserCourseAnalytics,
  UserExerciseStatsQuery,
  UserExercisesStats
} from '$lib/utils/types/analytics';
import { fetchCourses, fetchProfileCourseProgress } from '$lib/utils/services/courses';

import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';

const supabase = getServerSupabase();

const CACHE_DURATION = 60 * 5; // 5 minutes

export async function POST({ setHeaders, request }) {
  const { userId, courseId, orgId } = await request.json();

  if (!userId) {
    return json({ success: false, message: 'Request is missing required fields' }, { status: 400 });
  }

  setHeaders({
    'cache-control': `max-age=${CACHE_DURATION}`,
    'content-type': 'application/json'
  });

  if (courseId) {
    const userCourseAnalytics = await getStudentAnalyticsData(userId, courseId);
    return json(userCourseAnalytics);
  }

  if (orgId) {
    const userAnalytics = await getAudienceData(userId, orgId);
    return json(userAnalytics);
  }

  return json({ error: 'Invalid request' }, { status: 400 });
}

function sumArrObject<T>(arr: T[], key: keyof T) {
  return arr.reduce((sum, item) => sum + ((item[key] as number) || 0), 0);
}

function roundNumber(a: number, b: number) {
  return Math.round(a / b) * 100 || 0;
}

async function getLastLogin(userId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('analytics_login_events')
      .select('logged_in_at')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data?.logged_in_at;
  } catch (error) {
    console.error(error);
  }
}

async function getAudienceData(userId: string, orgId: string): Promise<UserAnalytics> {
  const audienceAnalytics: UserAnalytics = {
    user: {
      id: userId,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      avatarUrl: 'https://example.com/avatar.png',
      lastSeen: new Date().toISOString()
    },
    courses: [],
    overallCourseProgress: 0,
    overallAverageGrade: 0
  };

  const userResult = await supabase
    .from('profile')
    .select('fullname, email, avatar_url')
    .eq('id', userId)
    .single();

  if (userResult.error) throw new Error('Failed to fetch user profile');

  audienceAnalytics.user.fullName = userResult.data.fullname;
  audienceAnalytics.user.email = userResult.data.email;
  audienceAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  audienceAnalytics.user.lastSeen = await getLastLogin(userId);

  const { allCourses = [] } = (await fetchCourses(userId, orgId)) || {};

  for (const course of allCourses) {
    const [userExercisesStats, userCourseProgress] = await Promise.all([
      fetchUserExercisesStats(course.id, userId),
      fetchProfileCourseProgress(course.id, userId)
    ]);

    const courseProgress = userCourseProgress?.data?.[0];

    const exercisesStats = userExercisesStats || [];
    const totalEarnedPoints = sumArrObject(exercisesStats, 'score');
    const totalPoints = sumArrObject(exercisesStats, 'totalPoints');

    const averageGrade = roundNumber(totalEarnedPoints, totalPoints);
    const lessonsCompleted = courseProgress?.lessons_completed || 0;
    const lessonsCount = courseProgress?.lessons_count || 0;

    audienceAnalytics.courses.push({
      ...course,
      ...courseProgress,
      progress_percentage: roundNumber(lessonsCompleted, lessonsCount),
      average_grade: averageGrade
    });
  }

  const totalLessons = audienceAnalytics.courses.reduce(
    (acc, course) => acc + course.lessons_count,
    0
  );
  const completedLessons = audienceAnalytics.courses.reduce(
    (acc, course) => acc + course.lessons_completed,
    0
  );
  const overallCourseProgress = roundNumber(completedLessons, totalLessons);

  const allGrades = sumArrObject(audienceAnalytics.courses, 'average_grade');
  const overallAverageGrade = roundNumber(allGrades, audienceAnalytics.courses.length);

  audienceAnalytics.overallCourseProgress = overallCourseProgress;
  audienceAnalytics.overallAverageGrade = overallAverageGrade || 0;

  return audienceAnalytics;
}

async function getStudentAnalyticsData(
  userId: string,
  courseId: string
): Promise<UserCourseAnalytics> {
  const userCourseAnalytics: UserCourseAnalytics = {
    user: {
      id: userId,
      fullName: '',
      avatarUrl: '',
      lastSeen: '',
      email: ''
    },
    averageGrade: 0,
    userExercisesStats: [],
    totalExercises: 0,
    completedExercises: 0,
    progressPercentage: 0
  };

  // fetch user details
  const { data: userResult, error: userError } = await supabase
    .from('profile')
    .select('fullname, email, avatar_url')
    .eq('id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user profile' + userError.message);

  userCourseAnalytics.user.fullName = userResult.fullname;
  userCourseAnalytics.user.email = userResult.email;
  userCourseAnalytics.user.avatarUrl = userResult.avatar_url || '';
  userCourseAnalytics.user.lastSeen = await getLastLogin(userId);

  // fetch marks, lessons, and exercise progress
  const [userExercisesStats, lessonCompletions, exerciseResponse] = await Promise.all([
    fetchUserExercisesStats(courseId, userId),
    fetchLessonCompletion(courseId, userId),
    fetchProfileCourseProgress(courseId, userId)
  ]);

  if (!userExercisesStats || !lessonCompletions || !exerciseResponse.data) {
    throw new Error('Failed to fetch course analytics data');
  }

  const totalEarnedPoints = sumArrObject(userExercisesStats, 'score');
  const totalPoints = sumArrObject(userExercisesStats, 'totalPoints');

  userCourseAnalytics.averageGrade = roundNumber(totalEarnedPoints, totalPoints);
  userCourseAnalytics.userExercisesStats = userExercisesStats;

  const completedLessons = lessonCompletions.filter((lesson) => lesson.completed);

  userCourseAnalytics.totalExercises = exerciseResponse.data[0].exercises_count;
  userCourseAnalytics.completedExercises = exerciseResponse.data[0].exercises_completed;

  userCourseAnalytics.progressPercentage = roundNumber(
    completedLessons.length,
    lessonCompletions.length
  );

  return userCourseAnalytics;
}

async function fetchUserExercisesStats(
  courseId: string,
  userId: string
): Promise<UserExercisesStats[] | undefined> {
  try {
    const { data: courseData, error: queryError } = await supabase
      .from('course')
      .select(
        `
        lesson!inner (
          title,exercise!left (
            id,title,lesson_id,created_at,question (points),
            submission!left (
              id,total,status_id,submitted_by,groupmember!inner (id,profile_id)
            )
          )
        )
      `
      )
      .eq('lesson.exercise.submission.groupmember.profile_id', userId)
      .eq('id', courseId)
      .returns<UserExerciseStatsQuery[]>();

    if (queryError) {
      console.error('Error fetching exercise data:', queryError);
      return;
    }

    const userExercisesStats = courseData[0].lesson.flatMap((lesson) =>
      lesson.exercise.map((exercise) => {
        const totalPoints = exercise.question.reduce((sum, q) => sum + (q.points || 0), 0);

        const userSubmission = exercise.submission[0];

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
      })
    );

    return userExercisesStats;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function fetchLessonCompletion(courseId, userId) {
  try {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lesson')
      .select(
        `
        id,title,created_at,
        exercise:exercise(id),
        lesson_completion!left (lesson_id)
      `
      )
      .eq('course_id', courseId)
      .eq('lesson_completion.profile_id', userId);

    if (lessonsError) throw lessonsError;

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      created_at: lesson.created_at,
      completed: lesson.lesson_completion.length > 0,
      exerciseNo: lesson.exercise.length
    }));
  } catch (error) {
    console.error('Error fetching lessons or completions:', error);
    return [];
  }
}
