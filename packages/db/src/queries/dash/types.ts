export interface OrganisationAnalytics {
  totalCertificates: number;
  numberOfCourses: number;
  totalStudents: number;
  topCourses: {
    id: string;
    title: string;
    enrollments: number;
    completion: number;
    certification: number;
  }[];
  recentCertifications: {
    id: string;
    avatarUrl: string;
    name: string;
    courseId: string;
    course: string;
    date: string;
  }[];
}
