export * from './config';
export * from './dashboard';

interface CourseMetadata {
  requirements?: string;
  description?: string;
  goals?: string;
  videoUrl?: '';
  showDiscount: false;
  discount: 0;
  paymentLink?: string;
  reward?: {
    show: boolean;
    description: string;
  };
  instructor?: {
    name: string;
    role: string;
    coursesNo: number;
    description: string;
    imgUrl: string;
  };
  reviews?: Array<Review>;
}

// Generated from https://supabase-schema.vercel.app/
export interface Organization {
  id: string /* primary key */;
  name: any; // type unknown;
}

export interface Profile {
  id: string /* primary key */;
  fullname: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  email?: any; // type unknown;
  can_add_course?: boolean;
  role?: any; // type unknown;
  goal?: any; // type unknown;
  source?: any; // type unknown;
}

export interface Question_type {
  id: number /* primary key */;
  label: any; // type unknown;
  created_at?: string;
  updated_at?: string;
  typename?: any; // type unknown;
}

export interface Submissionstatus {
  id: number /* primary key */;
  label: any; // type unknown;
  updated_at?: string;
}

export interface Group {
  id: string /* primary key */;
  name: any; // type unknown;
  description?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string /* foreign key to organization.id */;
  organization?: Organization;
  tutors: Profile[];
}

export interface Role {
  type: any; // type unknown;
  description?: any; // type unknown;
  id: number /* primary key */;
  updated_at?: string;
  created_at?: string;
}

export interface Waitinglist {
  id: number /* primary key */;
  email: any; // type unknown;
  created_at?: string;
}

export interface Course {
  title?: any; // type unknown;
  description: string; // type unknown;
  overview?: any; // type unknown;
  id?: string /* primary key */;
  created_at?: string;
  updated_at?: string;
  group_id?: string /* foreign key to group.id */;
  is_template?: boolean;
  organization_id?: string /* foreign key to organization.id */;
  logo?: string;
  slug?: any; // type unknown;
  metadata?: CourseMetadata;
  cost: number;
  currency?: string;
  group?: Group;
  organization?: Organization;
  is_certificate_downloadable?: boolean;
  certificate_theme?: string;
  status: string;
}

export interface Groupmember {
  id: string /* primary key */;
  group_id: string /* foreign key to group.id */;
  role_id: number /* foreign key to role.id */;
  profile_id?: string /* foreign key to profile.id */;
  email?: any; // type unknown;
  created_at?: string;
  assigned_student_id?: any; // type unknown;
  group?: Group;
  role?: Role;
  profile?: Profile;
}

export interface Organizationmember {
  id: number /* primary key */;
  organization_id: string /* foreign key to organization.id */;
  role_id: number /* foreign key to role.id */;
  profile_id: string /* foreign key to profile.id */;
  organization?: Organization;
  role?: Role;
  profile?: Profile;
}

export interface Group_attendance {
  id: number /* primary key */;
  created_at?: string;
  updated_at?: string;
  course_id?: string /* foreign key to course.id */;
  student_id?: string /* foreign key to groupmember.id */;
  is_present?: boolean;
  lesson_id: string;
  course?: Course;
  groupmember?: Groupmember;
}

enum VideoType {
  youtube,
  muse
}
export interface LessonPage {
  id?: string | null;
  totalExercises: Number;
  is_complete: Boolean;
  isSaving: Boolean;
  materials: {
    note: string;
    slide_url: string;
    videos: Array<{
      type: string;
      link: string;
      metadata?: {};
    }>;
  };
  exercises: [];
}

export interface Lesson {
  note?: any; // type unknown;
  videos?: []; // type unknown;
  slide_url?: any; // type unknown;
  course_id: string /* foreign key to course.id */;
  id?: string /* primary key */;
  created_at?: string;
  updated_at?: string;
  title: any; // type unknown;
  public?: boolean;
  lesson_at?: string;
  teacher_id?: string /* foreign key to profile.id */;
  is_unlocked?: boolean;
  is_complete?: boolean;
  call_url?: string;
  order?: number;
  course?: Course;
  profile?: Profile;
}

export interface Exercise {
  title: any; // type unknown;
  description?: any; // type unknown;
  lesson_id?: string /* foreign key to lesson.id */;
  created_at?: string;
  updated_at?: string;
  id: string /* primary key */;
  due_by?: string;
  lesson?: Lesson;
}

export interface Question {
  id: number /* primary key */;
  question_type_id: number /* foreign key to question_type.id */;
  title: any; // type unknown;
  created_at?: string;
  updated_at?: string;
  exercise_id: string /* foreign key to exercise.id */;
  name?: string;
  points?: any; // type unknown;
  order?: number;
  question_type?: Question_type;
  exercise?: Exercise;
}

export interface Submission {
  id: string /* primary key */;
  reviewer_id?: number;
  status_id?: number /* foreign key to submissionstatus.id */;
  total?: number;
  created_at?: string;
  updated_at?: string;
  exercise_id: string /* foreign key to exercise.id */;
  submitted_by?: string /* foreign key to groupmember.id */;
  course_id?: string /* foreign key to course.id */;
  submissionstatus?: Submissionstatus;
  exercise?: Exercise;
  groupmember?: Groupmember;
  course?: Course;
}

export interface Option {
  id: number /* primary key */;
  label: any; // type unknown;
  is_correct: boolean;
  question_id: number /* foreign key to question.id */;
  value?: string;
  created_at?: string;
  updated_at?: string;
  question?: Question;
}

export interface Question_answer {
  id: number /* primary key */;
  answers?: any[];
  question_id: number /* foreign key to question.id */;
  open_answer?: string;
  group_member_id: string /* foreign key to groupmember.id */;
  submission_id?: string /* foreign key to submission.id */;
  point?: number;
  question?: Question;
  groupmember?: Groupmember;
  submission?: Submission;
}

export interface Review {
  id: number;
  hide: boolean;
  name: string;
  avatar_url: string;
  rating: number;
  created_at: number;
  description: string;
}
