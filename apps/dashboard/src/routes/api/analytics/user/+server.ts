/* eslint-disable @typescript-eslint/no-explicit-any */
// import { supabase } from '$lib/utils/functions/supabase';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';
import { fetchCourses, fetchProfileCourseProgress, getMarks } from '$lib/utils/services/courses';

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


  // STEP 3: fetch completed courses and exercises for each of the user's courses
  const fetchCourseDataForAllCourses = updatedCourses.map(async (course) => {
    const { id: courseId } = course;

    const [ exerciseResponse, marksResponse] = await Promise.all([
      fetchProfileCourseProgress(courseId, userId),
      fetchLessonsExercisesAndSubmissions(courseId, userId),
    ]);
    
    return {
      course,
      exerciseResponse,
      marksResponse,
    };
  });

  const courseDataResults = await Promise.all(fetchCourseDataForAllCourses);

  // user's pending and completed courses
  audienceAnalytics.pendingCourses = updatedCourses.filter(
    (course) => course.progress_rate < 5
  );
  audienceAnalytics.completedCourses = updatedCourses.filter(
    (course) => course.progress_rate >= 5
  );

  // total completed lessons and exercises
  let totalExercises = 0;
  let totalPoints = 0;
  let totalMarksCount = 0;

  courseDataResults.forEach(({  exerciseResponse, marksResponse }) => {
    if ( exerciseResponse.data && marksResponse) {
      const { exercisesWithSubmissionsAndPoints } = marksResponse;
      
      // total exercises on all the user's course(s)
      totalExercises += exerciseResponse.data[0].exercises_count;

      totalPoints += exercisesWithSubmissionsAndPoints.reduce(
        (sum, exercise) => sum + exercise.grade,
        0
      );
      
      totalMarksCount += exercisesWithSubmissionsAndPoints.length;
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

  // fetch user details
  const userResult = await supabase.from('profile').select('*').eq('id', userId).single();
  if (userResult.error) throw new Error('Failed to fetch user profile');

  userCourseAnalytics.user.fullName = userResult.data.fullname;
  userCourseAnalytics.user.avatarUrl = userResult.data.avatar_url || '';
  userCourseAnalytics.user.lastSeen = userResult.data.last_seen || new Date().toISOString();

  // fetch marks, lessons, and exercise progress
  const marksResponse = await fetchLessonsExercisesAndSubmissions(courseId, userId);
  const lessonResponse = await fetchLessonCompletion(courseId, userId);
  const exerciseResponse = await fetchProfileCourseProgress(courseId, userId);

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

async function fetchLessonsExercisesAndSubmissions(courseId, userId) {
  try {
    // Step 1: fetch the groupmember rows where profile_id = userId
    const { data: groupmemberData, error: groupmemberError } = await supabase
      .from('groupmember')
      .select('id')
      .eq('profile_id', userId);

    if (groupmemberError) {
      console.error('Error fetching groupmember:', groupmemberError);
      return;
    }

    const groupmemberIds = groupmemberData.map(member => member.id); // Array of groupmember IDs

    // Step 2: fetch all lessons where course_id = courseId
    const { data: lessons, error: lessonError } = await supabase
      .from('lesson')
      .select('id')
      .eq('course_id', courseId);

    if (lessonError) {
      console.error('Error fetching lessons:', lessonError);
      return;
    }

    const lessonIds = lessons.map((lesson) => lesson.id);

    // Step 3: fetch all exercises for each lessonId
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercise')
      .select('title, id, lesson_id')
      .in('lesson_id', lessonIds);

    if (exerciseError) {
      console.error('Error fetching exercises:', exerciseError);
      return;
    }

    const exerciseList = exercises || [];

    // Step 4: fetch submissions where submitted_by matches any of the groupmemberIds
    const { data: submissions, error: submissionError } = await supabase
      .from('submission')
      .select('id, exercise_id, total')
      .in('submitted_by', groupmemberIds); // Use .in() to check multiple groupmemberIds

    if (submissionError) {
      console.error('Error fetching submissions:', submissionError);
      return;
    }

    const userSubmissions = submissions || [];

    // Step 5: fetch all questions and their points
    const { data: questions, error: questionError } = await supabase
      .from('question')
      .select('exercise_id, points'); // Only fetch exercise_id and points

    if (questionError) {
      console.error('Error fetching questions:', questionError);
      return;
    }

    // Step 6: attach submissions and total points to the corresponding exercises and filter out exercises with no submissions
    const exercisesWithSubmissionsAndPoints = exerciseList
      .map((exercise) => {
        // filter submissions related to this exercise
        const relatedSubmissions = userSubmissions.filter(
          (submission) => submission.exercise_id === exercise.id
        );

        // if no submissions for this exercise, skip it
        if (relatedSubmissions.length === 0) return null;

        // filter questions related to this exercise
        const relatedQuestions = questions.filter(
          (question) => question.exercise_id === exercise.id
        );

        // sum all points from related questions
        const totalPoints = relatedQuestions.reduce(
          (sum, question) => sum + (question.points || 0),
          0
        );

        return {
          ...exercise,
          grade: relatedSubmissions[0].total || 0, // add submission grade
          totalPoints // add total points of questions for this exercise
        };
      })
      .filter((exercise) => exercise !== null); // filter out exercises with no submissions

    // only the exercises with submissions and total points
    return {
      exercisesWithSubmissionsAndPoints
    };
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}


async function fetchLessonCompletion(courseId, userId) {
  try {
    // fetch all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lesson')
      .select(`id, title, created_at`)
      .eq('course_id', courseId);

    if (lessonsError) throw lessonsError;

    // fetch completed lessons from lesson_completion table for the user
    const { data: completedLessons, error: completionError } = await supabase
      .from('lesson_completion')
      .select('lesson_id')
      .eq('profile_id', userId);

    if (completionError) throw completionError;

    // map of completed lesson IDs
    const completedLessonIds = completedLessons.map((item) => item.lesson_id);

    // fetch exercise count for each lesson
    const lessonsWithExerciseCount = await Promise.all(
      lessons.map(async (lesson) => {
        const { data: exercises, error: exerciseError } = await supabase
          .from('exercise')
          .select('id')
          .eq('lesson_id', lesson.id);

        if (exerciseError) throw exerciseError;

        // count the number of exercises for the lesson
        const exerciseCount = exercises.length;

        return {
          ...lesson,
          completed: completedLessonIds.includes(lesson.id), // add completed status
          exerciseNo: exerciseCount // add exercise count
        };
      })
    );

    return lessonsWithExerciseCount;
  } catch (error) {
    console.error('Error fetching lessons or completions:', error);
    return [];
  }
}