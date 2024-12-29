import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { fetchCourses, fetchProfileCourseProgress } from '$lib/utils/services/courses';
import {
  UserAnalytics,
  UserCourseAnalytics,
  UserExerciseStatsQuery,
  UserExercisesStats
} from '$lib/utils/types/analytics';
import { json } from '@sveltejs/kit';

const supabase = getServerSupabase();

const CACHE_DURATION = 60; // 1 minute

export async function POST({ setHeaders, request }) {
  const { userId, courseId, orgId } = await request.json();

  const accessToken = request.headers.get('Authorization');

  if (!userId || !accessToken) {
    return json({ success: false, message: 'Request is missing required fields' }, { status: 400 });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    return json({ success: false, message: 'Unauthenticated user' }, { status: 401 });
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
  return arr.reduce((sum, item) => sum + (item[key] as number), 0);
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

  const lastLoginResult = await supabase
    .from('user_last_login')
    .select('last_login_at')
    .eq('user_id', userId);

  if (lastLoginResult.error)
    throw new Error('Failed to fetch last login' + lastLoginResult.error.message);

  audienceAnalytics.user.fullName = userResult.data.fullname;
  audienceAnalytics.user.email = userResult.data.email;
  audienceAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  audienceAnalytics.user.lastSeen = lastLoginResult.data?.[0]?.last_login_at;

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

    const averageGrade = Math.round((totalEarnedPoints / totalPoints) * 100);
    const lessonsCompleted = courseProgress?.lessons_completed || 0;
    const lessonsCount = courseProgress?.lessons_count || 0;

    audienceAnalytics.courses.push({
      ...course,
      ...courseProgress,
      progress_percentage: Math.round((lessonsCompleted / lessonsCount) * 100),
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
  const overallCourseProgress = Math.round((completedLessons / totalLessons) * 100);

  const allGrades = sumArrObject(audienceAnalytics.courses, 'average_grade');
  const overallAverageGrade = Math.round(allGrades / audienceAnalytics.courses.length);

  audienceAnalytics.overallCourseProgress = overallCourseProgress;
  audienceAnalytics.overallAverageGrade = overallAverageGrade;

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

  const { data: lastLoginResult, error: lastLoginError } = await supabase
    .from('user_last_login')
    .select('last_login_at')
    .eq('user_id', userId);

  if (lastLoginError) throw new Error('Failed to fetch last login' + lastLoginError.message);

  userCourseAnalytics.user.fullName = userResult.fullname;
  userCourseAnalytics.user.email = userResult.email;
  userCourseAnalytics.user.avatarUrl = userResult.avatar_url || '';
  userCourseAnalytics.user.lastSeen = lastLoginResult?.[0]?.last_login_at;

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

  userCourseAnalytics.averageGrade = Math.round((totalEarnedPoints / totalPoints) * 100);
  userCourseAnalytics.userExercisesStats = userExercisesStats;

  const completedLessons = lessonCompletions.filter((lesson) => lesson.completed);

  userCourseAnalytics.totalExercises = exerciseResponse.data[0].exercises_count;
  userCourseAnalytics.completedExercises = exerciseResponse.data[0].exercises_completed;

  userCourseAnalytics.progressPercentage = Math.round(
    (completedLessons.length / lessonCompletions.length) * 100
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
