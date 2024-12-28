/* eslint-disable @typescript-eslint/no-explicit-any */
// import { supabase } from '$lib/utils/functions/supabase';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { fetchCourses, fetchProfileCourseProgress } from '$lib/utils/services/courses';
import { json } from '@sveltejs/kit';

const supabase = getServerSupabase();

// import { Redis } from '@upstash/redis';
// import { Ratelimit } from '@upstash/ratelimit';

// const redis = new Redis({
//   url: import.meta.env.UPSTASH_REDIS_REST_URL,
//   token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
// });

// const ratelimit = new Ratelimit({
//   redis: redis,
//   limiter: Ratelimit.slidingWindow(5, '10 s'),
// });

interface UserData {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  lastSeen: string | undefined;
}

interface CourseData {
  title: string;
  description: string;
  bannerUrl: string;
  progress: number; // 0-100
}

// interface LessonData {
//   id: string;
//   title: string;
//   completed: boolean;
//   exerciseNo: number;
//   created_at: any;
// }

interface Metric {
  lesson: {
    total: number;
    completed: number;
  };
  exercise: {
    total: number;
    completed: number;
    averageGrade: number;
  };
  progressPercentage: number;
}

interface UserAnalytics {
  user: UserData;
  pendingCourses: CourseData[];
  completedCourses: CourseData[];
  metrics: Metric;
}

interface UserCourseAnalytics {
  user: UserData;
  averageGrade: number;
  userExercisesStats: UserExercisesStats[];
  totalExercises: number;
  completedExercises: number;
  // pendingLessons: LessonData[];
  // completedLessons: LessonData[];
  progressPercentage: number;
}

interface UserExercisesStats {
  id: string;
  lessonId: string;
  title: string;
  status: string | undefined;
  score: number;
  totalPoints: number;
  isCompleted: boolean;
}

interface UserExerciseStatsQuery {
  lesson: {
    exercise: {
      id: string;
      title: string;
      lesson_id: string;
      question: { points: number }[];
      submission: {
        groupmember: { id: string; profile_id: string };
        total: number;
        id: string;
        status_id: string;
      }[];
    }[];
  }[];
}

export async function POST({ request }: { request: Request }) {
  // const ip = getClientAddress();
  // const { success } = await ratelimit.limit(ip);

  // if (!success) {
  //   return json({ error: 'Too many requests' }, { status: 429 });
  // }

  const { userId, courseId, orgId } = await request.json();

  if (courseId) {
    const userCourseAnalytics = await getStudentAnalyticsData(userId, courseId);
    return json(userCourseAnalytics);
  } else if (orgId) {
    const userAnalytics = await getAudienceData(userId, orgId);
    return json(userAnalytics);
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
    pendingCourses: [],
    completedCourses: [],
    metrics: {
      lesson: { total: 0, completed: 0 },
      exercise: { total: 0, completed: 0, averageGrade: 0 },
      progressPercentage: 0
    }
  };

  // STEP 1: fetch user details
  const userResult = await supabase.from('profile').select('*').eq('id', userId).single();
  if (userResult.error) throw new Error('Failed to fetch user profile');

  const lastLoginResult = await supabase
    .from('user_last_login')
    .select('last_login_at')
    .eq('user_id', userId);

  if (lastLoginResult.error)
    throw new Error('Failed to fetch last login' + lastLoginResult.error.message);

  const lastSeen = lastLoginResult.data?.[0]?.last_login_at;

  audienceAnalytics.user.id = userResult.data.id;
  audienceAnalytics.user.fullName = userResult.data.fullname;
  audienceAnalytics.user.email = userResult.data.email;
  audienceAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  audienceAnalytics.user.lastSeen = lastSeen;

  // STEP 2: fetch all courses for the user
  const coursesResult = await fetchCourses(userId, orgId);
  const allCourses = coursesResult?.allCourses || [];

  // add individual course percentage to each course object
  const updatedCourses = addCourseProgress(allCourses);

  // STEP 3: fetch completed courses and exercises for each of the user's courses
  const fetchCourseDataForAllCourses = updatedCourses.map(async (course) => {
    const { id: courseId } = course;

    const [exerciseResponse, userExercisesStats] = await Promise.all([
      fetchProfileCourseProgress(courseId, userId),
      fetchUserExercisesStats(courseId, userId)
    ]);

    return {
      course,
      exerciseResponse,
      userExercisesStats
    };
  });

  const courseDataResults = await Promise.all(fetchCourseDataForAllCourses);

  // user's pending and completed courses
  audienceAnalytics.pendingCourses = updatedCourses.filter((course) => course.progress_rate < 5);
  audienceAnalytics.completedCourses = updatedCourses.filter((course) => course.progress_rate >= 5);

  // total completed lessons and exercises
  let totalExercises = 0;
  let totalPoints = 0;
  let totalMarksCount = 0;

  courseDataResults.forEach(({ exerciseResponse, userExercisesStats }) => {
    if (exerciseResponse.data && userExercisesStats) {
      // total exercises on all the user's course(s)
      totalExercises += exerciseResponse.data[0].exercises_count;

      totalPoints += userExercisesStats.reduce((sum, exercise) => sum + exercise.grade, 0);

      totalMarksCount += userExercisesStats.length;
    }
  });

  audienceAnalytics.metrics.exercise.total = totalExercises;
  audienceAnalytics.metrics.exercise.completed = totalMarksCount || 0;
  audienceAnalytics.metrics.exercise.averageGrade = totalPoints / totalMarksCount || 0;

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
    // pendingLessons: [],
    // completedLessons: [],
    progressPercentage: 0
  };

  // fetch user details
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

  const lastSeen = lastLoginResult.data?.[0]?.last_login_at;

  userCourseAnalytics.user.fullName = userResult.data.fullname;
  userCourseAnalytics.user.email = userResult.data.email;
  userCourseAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  userCourseAnalytics.user.lastSeen = lastSeen;

  // fetch marks, lessons, and exercise progress
  const [userExercisesStats, lessonResponse, exerciseResponse] = await Promise.all([
    fetchUserExercisesStats(courseId, userId),
    fetchLessonCompletion(courseId, userId),
    fetchProfileCourseProgress(courseId, userId)
  ]);

  if (!userExercisesStats || !lessonResponse || !exerciseResponse.data) {
    throw new Error('Failed to fetch course analytics data');
  }

  // Calculate averages, lessons, and exercises
  const totalEarnedPoints = userExercisesStats.reduce((sum, exercise) => sum + exercise.score, 0);
  const totalPoints = userExercisesStats.reduce((sum, exercise) => sum + exercise.totalPoints, 0);
  userCourseAnalytics.averageGrade = Math.round((totalEarnedPoints / totalPoints) * 100);

  userCourseAnalytics.userExercisesStats = userExercisesStats;

  const completedLessons = lessonResponse.filter((lesson) => lesson.completed);
  // userCourseAnalytics.completedLessons = lessonResponse.filter((lesson) => lesson.completed);
  // userCourseAnalytics.pendingLessons = lessonResponse.filter((lesson) => !lesson.completed);

  userCourseAnalytics.totalExercises = exerciseResponse.data[0].exercises_count;
  userCourseAnalytics.completedExercises = exerciseResponse.data[0].exercises_completed;

  // Calculate total progress percentage
  const totalLessons = lessonResponse.length;

  userCourseAnalytics.progressPercentage = Math.round(
    (completedLessons.length / totalLessons) * 100
  );

  return userCourseAnalytics;
}

function addCourseProgress(courses) {
  return courses.map((course) => {
    const { progress_rate, total_lessons } = course;

    // calculate the completion percentage
    const courseProgress = ((progress_rate / total_lessons) * 100).toFixed(2);

    // add percentage to each course object
    return { ...course, courseProgress: `${courseProgress}` };
  });
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
          exercise!inner (id,title,lesson_id,question (points),
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
        id, 
        title,
        created_at,
        exercise:exercise(id),
        lesson_completion!left (
          lesson_id
        )
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
