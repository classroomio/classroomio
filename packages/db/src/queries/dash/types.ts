export interface OrganisationAnalytics {
  revenue: number;
  numberOfCourses: number;
  totalStudents: number;
  topCourses: {
    id: string;
    title: string;
    enrollments: number;
    completion: number;
  }[];
  enrollments: {
    id: string;
    avatarUrl: string;
    name: string;
    courseId: string;
    course: string;
    date: string;
  }[];
}
