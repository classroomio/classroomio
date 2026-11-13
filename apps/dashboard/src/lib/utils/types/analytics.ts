interface User {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  lastSeen: string | undefined;
}

export interface UserCourseWithStats {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string;
  logo: string;
  banner_image: string;
  cost: number;
  currency: string;
  is_published: boolean;
  total_lessons: number;
  total_students: number;
  progress_rate: number;
  progress_percentage: number;
  type: string;
  member_profile_id: string;
  lessons_count: number;
  lessons_completed: number;
  exercises_count: number;
  exercises_completed: number;
  average_grade: number;
}

// interface LessonData {
//   id: string;
//   title: string;
//   completed: boolean;
//   exerciseNo: number;
//   created_at: any;
// }

// interface Metric {
//   lesson: {
//     total: number;
//     completed: number;
//   };
//   exercise: {
//     total: number;
//     completed: number;
//     averageGrade: number;
//   };
//   progressPercentage: number;
// }

export interface UserAnalytics {
  user: User;
  courses: UserCourseWithStats[];
  overallCourseProgress: number;
  overallAverageGrade: number;
}

export interface UserCourseAnalytics {
  user: User;
  averageGrade: number;
  userExercisesStats: UserExercisesStats[];
  totalExercises: number;
  completedExercises: number;
  // pendingLessons: LessonData[];
  // completedLessons: LessonData[];
  progressPercentage: number;
}

export interface UserExercisesStats {
  id: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  status: number | string | undefined;
  score: number;
  totalPoints: number;
  isCompleted: boolean;
}

export interface UserExerciseStatsQuery {
  lesson: {
    title: string;
    exercise: {
      id: string;
      title: string;
      lesson_id: string;
      created_at: string;
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
