/**
 * Mock data for the student-profile redesign prototypes.
 *
 * Field names mirror the real payloads so a chosen prototype can be wired up
 * without reshaping data:
 *   - `StudentProfileAnalytics` → `GET /organization/audience/:userId/analytics`
 *   - `CourseStudentAnalytics`  → the `userCourseAnalytics` server load on
 *                                 `/courses/[id]/people/[personId]`
 *
 * Only fields that exist on the real runtime payload are modelled. The one
 * exception is `StudentProfileCourse.exercises`, which the API fetches per course
 * today and discards after averaging — see the PRD.
 */

/* ------------------------------------------------------------------ */
/* Exercise rows (shared by both surfaces)                             */
/* ------------------------------------------------------------------ */

/**
 * Submission status codes, from
 * `apps/dashboard/src/lib/features/course/components/exercise/constants.ts`.
 * `PENDING` has no DB row — "not submitted" arrives as `status: undefined` plus
 * `isCompleted: false`, never as `0`.
 */
export const SUBMISSION_STATUS = { PENDING: 0, SUBMITTED: 1, IN_PROGRESS: 2, GRADED: 3 } as const;

/** Mirrors a `getUserExercisesStats` row exactly. */
export interface StudentExerciseStat {
  id: string;
  lessonId: string | null;
  lessonTitle: string;
  title: string;
  status: number | undefined;
  score: number;
  totalPoints: number;
  isCompleted: boolean;
}

export const supabaseExercises: StudentExerciseStat[] = [
  {
    id: 'e-1',
    lessonId: 'l-1',
    lessonTitle: 'Setting up Supabase',
    title: 'Provision your first project',
    status: SUBMISSION_STATUS.GRADED,
    score: 18,
    totalPoints: 20,
    isCompleted: true
  },
  {
    id: 'e-2',
    lessonId: 'l-2',
    lessonTitle: 'Row Level Security',
    title: 'Write an RLS policy for the posts table',
    status: SUBMISSION_STATUS.GRADED,
    score: 12,
    totalPoints: 20,
    isCompleted: true
  },
  {
    id: 'e-3',
    lessonId: 'l-3',
    lessonTitle: 'Realtime subscriptions',
    title: 'Build a live comment feed',
    status: SUBMISSION_STATUS.SUBMITTED,
    score: 0,
    totalPoints: 25,
    isCompleted: true
  },
  {
    id: 'e-4',
    lessonId: 'l-4',
    lessonTitle: 'Edge Functions',
    title: 'Deploy a webhook handler',
    status: SUBMISSION_STATUS.IN_PROGRESS,
    score: 0,
    totalPoints: 15,
    isCompleted: true
  },
  {
    id: 'e-5',
    lessonId: 'l-5',
    lessonTitle: 'Auth deep dive',
    title: 'Add magic-link sign in',
    status: undefined,
    score: 0,
    totalPoints: 20,
    isCompleted: false
  },
  {
    // `exercise.lessonId` is nullable in the schema, so a row must render
    // without a lesson link.
    id: 'e-6',
    lessonId: null,
    lessonTitle: '',
    title: 'Final capstone submission',
    status: undefined,
    score: 0,
    totalPoints: 50,
    isCompleted: false
  }
];

const reactExercises: StudentExerciseStat[] = [
  {
    id: 'e-r1',
    lessonId: 'l-r1',
    lessonTitle: 'Component patterns',
    title: 'Refactor to compound components',
    status: SUBMISSION_STATUS.GRADED,
    score: 19,
    totalPoints: 20,
    isCompleted: true
  },
  {
    id: 'e-r2',
    lessonId: 'l-r2',
    lessonTitle: 'Data fetching',
    title: 'Add optimistic updates',
    status: SUBMISSION_STATUS.GRADED,
    score: 17,
    totalPoints: 20,
    isCompleted: true
  }
];

const pythonExercises: StudentExerciseStat[] = [
  {
    id: 'e-p1',
    lessonId: 'l-p1',
    lessonTitle: 'DataFrames',
    title: 'Clean the housing dataset',
    status: SUBMISSION_STATUS.GRADED,
    score: 9,
    totalPoints: 20,
    isCompleted: true
  },
  {
    id: 'e-p2',
    lessonId: 'l-p2',
    lessonTitle: 'Joins and aggregation',
    title: 'Group sales by region',
    status: undefined,
    score: 0,
    totalPoints: 20,
    isCompleted: false
  }
];

export function isGraded(exercise: StudentExerciseStat) {
  return exercise.status === SUBMISSION_STATUS.GRADED;
}

export function countCompletedExercises(list: StudentExerciseStat[]) {
  return list.filter((exercise) => exercise.isCompleted).length;
}

/* ------------------------------------------------------------------ */
/* Org-wide student profile (/org/[slug]/audience/[profileId])          */
/* ------------------------------------------------------------------ */

export interface StudentProfileCourse {
  id: string;
  title: string;
  description: string;
  logo: string | null;
  type: 'SELF_PACED' | 'LIVE_CLASS';
  lessons_count: number;
  lessons_completed: number;
  exercises_count: number;
  exercises_completed: number;
  progress_percentage: number;
  average_grade: number;
  /**
   * Per-exercise rows for this course. The API already fetches these per course
   * (`getUserExercisesStats`) and currently discards them after averaging into
   * `average_grade` — surfacing them is the one API change this redesign needs.
   */
  exercises: StudentExerciseStat[];
}

export interface StudentProfileAnalytics {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    lastSeen: string | undefined;
  };
  courses: StudentProfileCourse[];
  overallCourseProgress: number;
  overallAverageGrade: number;
}

const SUPABASE_LOGO = 'https://placehold.co/240x160/1e3a8a/ffffff?text=Supabase+%26+Svelte';
const REACT_LOGO = 'https://placehold.co/240x160/0f172a/38bdf8?text=Modern+React';
const PYTHON_LOGO = 'https://placehold.co/240x160/134e4a/99f6e4?text=Data+Science';
const DESIGN_LOGO = 'https://placehold.co/240x160/4c1d95/ede9fe?text=Design+Systems';

export const student: StudentProfileAnalytics['user'] = {
  id: 'e2f0a1c4-8b1e-4a4b-9f77-6c2d4c0a1b23',
  fullName: 'Abdul-muizz Hamzat',
  email: 'abdulmuizzayo6@gmail.com',
  avatarUrl: 'https://github.com/shadcn.png',
  lastSeen: '5 days ago'
};

export const courses: StudentProfileCourse[] = [
  {
    id: 'c-1',
    title: 'Building Fullstack Applications with Supabase & Svelte',
    description:
      'Dive into real-time web application development with our Supabase Mastery Bootcamp, tailored for Svelte developers. Hands-on projects, weekly reviews and a capstone.',
    logo: SUPABASE_LOGO,
    type: 'SELF_PACED',
    lessons_count: 24,
    lessons_completed: 9,
    exercises_count: 6,
    exercises_completed: 4,
    progress_percentage: 38,
    average_grade: 72,
    exercises: supabaseExercises
  },
  {
    id: 'c-2',
    title: 'Modern Web Development with React',
    description:
      'Component patterns, data fetching, routing and testing — everything needed to ship a production React application.',
    logo: REACT_LOGO,
    type: 'LIVE_CLASS',
    lessons_count: 18,
    lessons_completed: 18,
    exercises_count: 2,
    exercises_completed: 2,
    progress_percentage: 100,
    average_grade: 91,
    exercises: reactExercises
  },
  {
    id: 'c-3',
    title: 'Data Science with Python and Pandas',
    description:
      'Clean, reshape and visualise real datasets. Covers dataframes, aggregation, joins and a final analysis notebook.',
    logo: PYTHON_LOGO,
    type: 'SELF_PACED',
    lessons_count: 30,
    lessons_completed: 4,
    exercises_count: 2,
    exercises_completed: 1,
    progress_percentage: 13,
    average_grade: 45,
    exercises: pythonExercises
  },
  {
    id: 'c-4',
    title: 'Design Systems Fundamentals',
    description:
      'Tokens, primitives and documentation practices for building a component library a whole team can rely on.',
    logo: DESIGN_LOGO,
    type: 'SELF_PACED',
    lessons_count: 12,
    lessons_completed: 0,
    exercises_count: 0,
    exercises_completed: 0,
    progress_percentage: 0,
    average_grade: 0,
    exercises: []
  }
];

export const analytics: StudentProfileAnalytics = {
  user: student,
  courses,
  overallCourseProgress: 41,
  overallAverageGrade: 68
};

/** The state this page most often renders in: one course, nothing started. */
export const justEnrolledAnalytics: StudentProfileAnalytics = {
  user: student,
  courses: [
    {
      ...courses[0]!,
      lessons_completed: 0,
      exercises_completed: 0,
      progress_percentage: 0,
      average_grade: 0,
      exercises: courses[0]!.exercises.map((exercise) => ({
        ...exercise,
        status: undefined,
        score: 0,
        isCompleted: false
      }))
    }
  ],
  overallCourseProgress: 0,
  overallAverageGrade: 0
};

export const noCoursesAnalytics: StudentProfileAnalytics = {
  user: student,
  courses: [],
  overallCourseProgress: 0,
  overallAverageGrade: 0
};

export function isComplete(course: StudentProfileCourse) {
  return course.lessons_count > 0 && course.lessons_completed === course.lessons_count;
}

export function countComplete(list: StudentProfileCourse[]) {
  return list.filter(isComplete).length;
}

/* ------------------------------------------------------------------ */
/* Course-scoped student detail (/courses/[id]/people/[personId])       */
/* ------------------------------------------------------------------ */

export interface CourseStudentAnalytics {
  user: StudentProfileAnalytics['user'];
  courseTitle: string;
  progressPercentage: number;
  averageGrade: number;
  lessonsCompleted: number;
  lessonsCount: number;
  userExercisesStats: StudentExerciseStat[];
}

export const courseStudent: CourseStudentAnalytics = {
  user: student,
  courseTitle: 'Building Fullstack Applications with Supabase & Svelte',
  progressPercentage: 38,
  averageGrade: 72,
  lessonsCompleted: 9,
  lessonsCount: 24,
  userExercisesStats: supabaseExercises
};

/** Enrolled, nothing attempted. */
export const courseStudentNotStarted: CourseStudentAnalytics = {
  ...courseStudent,
  progressPercentage: 0,
  averageGrade: 0,
  lessonsCompleted: 0,
  userExercisesStats: supabaseExercises.map((exercise) => ({
    ...exercise,
    status: undefined,
    score: 0,
    isCompleted: false
  }))
};

/** A course with no exercises authored yet. */
export const courseStudentNoExercises: CourseStudentAnalytics = {
  ...courseStudent,
  userExercisesStats: []
};
