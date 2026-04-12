export interface TopCourse {
  id: string;
  title: string;
  enrollments: number;
  completion: number;
  certification: number;
}

export interface RecentCertification {
  id: string;
  avatarUrl: string | null;
  name: string;
  courseId: string;
  course: string;
  date: string;
}

export interface OrganisationAnalytics {
  totalCertificates: number;
  numberOfCourses: number;
  totalStudents: number;
  topCourses: TopCourse[];
  recentCertifications: RecentCertification[];
}
