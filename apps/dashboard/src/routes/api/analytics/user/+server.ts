/* eslint-disable @typescript-eslint/no-explicit-any */
// import { supabase } from '$lib/utils/functions/supabase';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';
import { fetchCourses, fetchProfileCourseProgress } from '$lib/utils/services/courses';

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
  lastSeen: string;
}

interface CourseData {
  title: string;
  description: string;
  bannerUrl: string;
  progress: number; // 0-100
}

interface LessonData {
  id: string;
  title: string;
  completed: boolean;
  exerciseNo: number;
  created_at: any;
}

interface Grade {
  id: any;
  title: string;
  grade: {
    exercise_id: any;
    total: number;
  };
}

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
  average: number;
  grades: Grade[];
  totalExercises: number;
  completedExercises: number;
  pendingLessons: LessonData[];
  completedLessons: LessonData[];
  progressPercentage: number;
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
  }

  if (orgId) {
    const userAnalytics = await getAudienceData(userId, orgId);
    return json(userAnalytics);
  }
}

function addCourseProgress(courses) {
  return courses.map(course => {
    const { progress_rate, total_lessons } = course;
    
    // calculate the completion percentage
    const courseProgress = total_lessons > 0 
      ? ((progress_rate / total_lessons) * 100).toFixed(2) 
      : 0;

      // add percentage to each course object
    return { ...course, courseProgress: `${courseProgress}` };
  });
}


async function getAudienceData(userId: string, orgId: string): Promise<UserAnalytics> {
  const audienceAnalytics: UserAnalytics = {
    user: {
      id: userId,
      fullName: 'John Doe',
      avatarUrl: 'https://example.com/avatar.png',
      lastSeen: new Date().toISOString(),
    },
    pendingCourses: [],
    completedCourses: [],
    metrics: {
      lesson: { total: 0, completed: 0 },
      exercise: { total: 0, completed: 0, averageGrade: 0 },
      progressPercentage: 0,
    },
  };

  // STEP 1: fetch user details
  const userResult = await supabase.from('profile').select('*').eq('id', userId).single();
  if (userResult.error) throw new Error('Failed to fetch user profile');

  audienceAnalytics.user.id = userResult.data.id;
  audienceAnalytics.user.fullName = userResult.data.fullname;
  audienceAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  audienceAnalytics.user.lastSeen = userResult.data.last_seen || new Date().toISOString();

  // STEP 2: fetch all courses for the user
  const coursesResult = await fetchCourses(userId, orgId);
  const allCourses = coursesResult?.allCourses || [];

  // add individual course percentage to each course object
  const updatedCourses = addCourseProgress(allCourses);


  // STEP 3: functions to fetch additional data for each course
  const fetchCourseDataForAllCourses = updatedCourses.map(async (course) => {
    const { id: courseId } = course;

    // Fetch lesson completion, profile course progress, and exercise data
    const [lessonResponse, exerciseResponse, marksResponse] = await Promise.all([
      fetchLessonCompletion(courseId, userId),
      fetchProfileCourseProgress(courseId, userId),
    ]);
    
    return {
      course,
      lessonResponse,
      exerciseResponse,
      marksResponse,
    };
  });

  const courseDataResults = await Promise.all(fetchCourseDataForAllCourses);

  // Process and filter pending and completed courses
  audienceAnalytics.pendingCourses = updatedCourses.filter(
    (course) => course.progress_rate < 5
  );
  audienceAnalytics.completedCourses = updatedCourses.filter(
    (course) => course.progress_rate >= 5
  );

  // Compute total completed lessons and exercises
  let totalCompleted = 0;
  let totalLessons = 0;
  let totalExercises = 0;
  let completedExercises = 0;
  let totalPoints = 0;
  let totalMarksCount = 0;

  courseDataResults.forEach(({ course, lessonResponse, exerciseResponse, marksResponse }) => {
    if (lessonResponse && exerciseResponse.data && marksResponse) {
      console.log('lessonResponse, exerciseResponse, marksResponse', lessonResponse, exerciseResponse, marksResponse);
      const { exercisesWithSubmissionsAndPoints } = marksResponse;

      totalLessons += lessonResponse.length;
      totalCompleted += course.progress_rate || 0;

      totalExercises += exerciseResponse.data[0].exercises_count;
      completedExercises += exerciseResponse.data[0].exercises_completed;

      totalPoints += exercisesWithSubmissionsAndPoints.reduce(
        (sum, exercise) => sum + exercise.grade,
        0
      );
      totalMarksCount += exercisesWithSubmissionsAndPoints.length;
    }
  });

  audienceAnalytics.metrics.progressPercentage =
    Math.round((totalCompleted / totalLessons) * 100) || 0;
  audienceAnalytics.metrics.exercise.total = totalExercises;
  audienceAnalytics.metrics.exercise.completed = completedExercises;
  audienceAnalytics.metrics.exercise.averageGrade = totalPoints / totalMarksCount || 0;
  audienceAnalytics.metrics.lesson.total = totalLessons;
  audienceAnalytics.metrics.lesson.completed = completedExercises;

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
      lastSeen: ''
    },
    average: 0,
    grades: [],
    totalExercises: 0,
    completedExercises: 0,
    pendingLessons: [],
    completedLessons: [],
    progressPercentage: 0
  };

  // Fetch user details
  const userResult = await supabase.from('profile').select('*').eq('id', userId).single();
  if (userResult.error) throw new Error('Failed to fetch user profile');

  userCourseAnalytics.user.fullName = userResult.data.fullname;
  userCourseAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  userCourseAnalytics.user.lastSeen = userResult.data.last_seen || new Date().toISOString();

  // Fetch marks, lessons, and exercise progress
  const marksResponse = await fetchLessonsExercisesAndSubmissions(courseId, userId);
  const lessonResponse = await fetchLessonCompletion(courseId, userId);
  const exerciseResponse = await fetchProfileCourseProgress(courseId, userId);

  console.log('exerciseResponse', exerciseResponse);

  if (!marksResponse || !lessonResponse || !exerciseResponse.data) {
    throw new Error('Failed to fetch course analytics data');
  }

  // Calculate averages, lessons, and exercises
  const totalPoints = marksResponse?.exercisesWithSubmissionsAndPoints.reduce(
    (sum, exercise) => sum + exercise.totalPoints,
    0
  );
  userCourseAnalytics.average =
    totalPoints / marksResponse.exercisesWithSubmissionsAndPoints.length || 0;

  userCourseAnalytics.grades = marksResponse.exercisesWithSubmissionsAndPoints;
  userCourseAnalytics.completedLessons = lessonResponse.filter((lesson) => lesson.completed);
  userCourseAnalytics.pendingLessons = lessonResponse.filter((lesson) => !lesson.completed);

  userCourseAnalytics.totalExercises = exerciseResponse.data[0].exercises_count;
  userCourseAnalytics.completedExercises = exerciseResponse.data[0].exercises_completed;

  // Calculate total progress percentage
  const totalLessons =
    userCourseAnalytics.completedLessons.length + userCourseAnalytics.pendingLessons.length;
  const completedLessons = userCourseAnalytics.completedLessons.length;
  userCourseAnalytics.progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return userCourseAnalytics;
}

async function fetchLessonsExercisesAndSubmissions(courseId, userId) {
  try {
    // Step 1: Fetch the groupmember rows where profile_id = userId
    const { data: groupmemberData, error: groupmemberError } = await supabase
      .from('groupmember')
      .select('id')
      .eq('profile_id', userId);

    if (groupmemberError) {
      console.error('Error fetching groupmember:', groupmemberError);
      return;
    }

    const groupmemberIds = groupmemberData.map(member => member.id); // Array of groupmember IDs

    // Step 2: Fetch all lessons where course_id = courseId
    const { data: lessons, error: lessonError } = await supabase
      .from('lesson')
      .select('id')
      .eq('course_id', courseId);

    if (lessonError) {
      console.error('Error fetching lessons:', lessonError);
      return;
    }

    const lessonIds = lessons.map((lesson) => lesson.id);

    // Step 3: Fetch all exercises for each lessonId
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercise')
      .select('title, id, lesson_id')
      .in('lesson_id', lessonIds);

    if (exerciseError) {
      console.error('Error fetching exercises:', exerciseError);
      return;
    }

    const exerciseList = exercises || [];

    // Step 4: Fetch submissions where submitted_by matches any of the groupmemberIds
    const { data: submissions, error: submissionError } = await supabase
      .from('submission')
      .select('id, exercise_id, total')
      .in('submitted_by', groupmemberIds); // Use .in() to check multiple groupmemberIds

    if (submissionError) {
      console.error('Error fetching submissions:', submissionError);
      return;
    }

    const userSubmissions = submissions || [];

    // Step 5: Fetch all questions and their points
    const { data: questions, error: questionError } = await supabase
      .from('question')
      .select('exercise_id, points'); // Only fetch exercise_id and points

    if (questionError) {
      console.error('Error fetching questions:', questionError);
      return;
    }

    // Step 6: Attach submissions and total points to the corresponding exercises and filter out exercises with no submissions
    const exercisesWithSubmissionsAndPoints = exerciseList
      .map((exercise) => {
        // Filter submissions related to this exercise
        const relatedSubmissions = userSubmissions.filter(
          (submission) => submission.exercise_id === exercise.id
        );

        // If no submissions for this exercise, skip it
        if (relatedSubmissions.length === 0) return null;

        // Filter questions related to this exercise
        const relatedQuestions = questions.filter(
          (question) => question.exercise_id === exercise.id
        );

        // Sum all points from related questions
        const totalPoints = relatedQuestions.reduce(
          (sum, question) => sum + (question.points || 0),
          0
        );

        return {
          ...exercise,
          grade: relatedSubmissions[0].total || 0, // Attach submission grade
          totalPoints // Attach total points of questions for this exercise
        };
      })
      .filter((exercise) => exercise !== null); // Filter out exercises with no submissions

    // Return only the exercises with submissions and total points
    return {
      exercisesWithSubmissionsAndPoints
    };
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}


async function fetchLessonCompletion(courseId, userId) {
  try {
    // Fetch all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lesson')
      .select(`id, title, created_at`)
      .eq('course_id', courseId);

    if (lessonsError) throw lessonsError;

    // Fetch completed lessons from lesson_completion table for the user
    const { data: completedLessons, error: completionError } = await supabase
      .from('lesson_completion')
      .select('lesson_id')
      .eq('profile_id', userId);

    if (completionError) throw completionError;

    // Map of completed lesson IDs
    const completedLessonIds = completedLessons.map((item) => item.lesson_id);

    // Fetch exercise count for each lesson
    const lessonsWithExerciseCount = await Promise.all(
      lessons.map(async (lesson) => {
        const { data: exercises, error: exerciseError } = await supabase
          .from('exercise')
          .select('id')
          .eq('lesson_id', lesson.id);

        if (exerciseError) throw exerciseError;

        // Count the number of exercises for the lesson
        const exerciseCount = exercises.length;

        return {
          ...lesson,
          completed: completedLessonIds.includes(lesson.id), // Attach completed status
          exerciseNo: exerciseCount // Attach exercise count
        };
      })
    );

    return lessonsWithExerciseCount;
  } catch (error) {
    console.error('Error fetching lessons or completions:', error);
    return [];
  }
}