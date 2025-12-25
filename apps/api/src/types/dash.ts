export interface TopCourse {
  id: string;
  title: string;
  enrollments: number;
  completion: number;
}

export interface Enrollment {
  id: string;
  avatarUrl: string | null;
  name: string;
  courseId: string;
  course: string;
  date: string;
}

export interface OrganisationAnalytics {
  revenue: number;
  numberOfCourses: number;
  totalStudents: number;
  topCourses: TopCourse[];
  enrollments: Enrollment[];
}
