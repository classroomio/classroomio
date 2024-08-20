export * from './config';
export * from './dashboard';

export enum LOCALE {
  EN = 'en',
  HI = 'hi',
  FR = 'fr',
  PT = 'pt',
  DE = 'de',
  VI = 'vi',
  RU = 'ru',
  ES = 'es'
}

//===============Custom Type===============

export interface ProfileCourseProgress {
  exercises_completed: number;
  exercises_count: number;
  lessons_completed: number;
  lessons_count: number;
}

export interface GroupPerson {
  assigned_student_id: number | null;
  created_at: string;
  email: string | null;
  group_id: string;
  id: string;
  memberId: string;
  profile: Partial<Profile>;
  profile_id: string;
  role_id: Role['id'];
  fullname?: string;
}

export interface GroupStore {
  id: string;
  tutors: GroupPerson[];
  students: GroupPerson[];
  people: GroupPerson[];
  members?: GroupPerson[];
  memberId?: string;
};

export interface CustomQuestionType {
  id: number;
  label: any;
}

export interface ExerciseTemplate {
  title: string;
  description: string;
  questionnaire: {
    questions: {
      title: string;
      name: string;
      points: number;
      order: number;
      question_type: CustomQuestionType;
      options: {
        label: string;
        is_correct: boolean;
      }[];
    }[];
  };
}
export interface ExerciseSubmissions {
  id: string;
  status_id: number;
  submitted_by: {
    profile: {
      id: string;
      fullname: string;
      avatar_url: string;
    };
  };
  answers: {
    answers: string[];
    group_member_id: string;
    id: number;
    open_answer: string;
    point: number;
    question_id: number;
    submission_id: string;
  }[];
}
//===========================================

interface CourseMetadata {
  requirements?: string;
  description?: string;
  goals?: string;
  videoUrl?: '';
  showDiscount?: false;
  discount?: 0;
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
  lessonTabsOrder?: Array<Tabs>;
  grading?: boolean;
  lessonDownload?: boolean;
  allowNewStudent?: boolean;
}

interface PathwayMetadata {
  requirements?: string;
  description?: string;
  goals?: string;
  videoUrl?: '';
  showDiscount?: false;
  discount?: 0;
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
  allowNewStudent?: boolean;
}

export interface LessonCommentInsertPayload {
  id: number;
  created_at: string;
  updated_at: string;
  lesson_id: string;
  groupmember_id: string;
  comment: string;
}
export interface LessonComment {
  name: string;
  avatar: string;
  comment: string;
  commentAt: string | Date;
}

// Generated from https://supabase-schema.vercel.app/
export interface Organization {
  id: string /* primary key */;
  name: any; // type unknown;
}

export interface OrganizationPlan {
  id: number;
  activated_at: string;
  deactivated_at: string;
  org_id: string;
  plan_name: string;
  is_active: boolean;
  updated_at: string;
  lmz_data: unknown;
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
  members: Groupmember[];
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

export enum COURSE_TYPE {
  SELF_PACED = 'SELF_PACED',
  LIVE_CLASS = 'LIVE_CLASS'
}
export interface Course {
  title: any; // type unknown;
  description: string; // type unknown;
  type: COURSE_TYPE;
  overview?: any; // type unknown;
  id?: string /* primary key */;
  created_at: string;
  updated_at: string;
  group_id?: string /* foreign key to group.id */;
  is_template?: boolean;
  organization_id?: string /* foreign key to organization.id */;
  logo?: string;
  slug?: any; // type unknown;
  metadata: CourseMetadata;
  cost: number;
  currency?: string;
  group?: Group;
  organization?: Organization;
  is_certificate_downloadable?: boolean;
  certificate_theme?: string;
  status: string;
  is_published?: boolean;
  progress_rate?: number;
  total_lessons?: number;
  total_students?: number;
  attendance: {
    student_id: string;
    lesson_id: string;
    is_present: boolean;
    id: number;
  }[];
  lessons?: Lesson[];
  polls: { status: string }[];
}

export interface CourseCompletion {
  id?: number;
  course_id: string;
  profile_id: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PathwayCourse {
  id: string;
  course: Course;
  course_id: any;
  pathway_id: any;
  order: number;
  created_at: string;
  updated_at: string;
  is_unlocked: boolean;
}

export interface Pathway {
  title?: any; // type unknown;
  description: string; // type unknown;
  overview?: any; // type unknown;
  id?: string /* primary key */;
  created_at: string;
  updated_at: string;
  group_id?: string /* foreign key to group.id */;
  is_template?: boolean;
  organization_id?: string /* foreign key to organization.id */;
  logo?: string;
  slug?: any; // type unknown;
  landingpage: PathwayMetadata;
  cost: number;
  currency?: string;
  group?: Group;
  organization?: Organization;
  is_certificate_downloadable?: boolean;
  certificate_theme?: string;
  status: string;
  is_published?: boolean;
  total_course?: number;
  total_students?: number;
  lms_certificate: boolean;
  courses_certificate: string;
  prerequisite: string;
  pathway_course: PathwayCourse[];
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

export enum VideoType {
  youtube,
  muse
}

export interface LessonPage {
  id?: string | null;
  totalExercises: number;
  totalComments: number;
  locale: LOCALE;
  isSaving: boolean;
  isFetching: boolean;
  materials: {
    note: string;
    slide_url: string;
    videos: Array<{
      type: string;
      link: string;
      metadata?: {
        svid?: string;
      };
    }>;
  };
  exercises: [];
  lesson_completion: LessonCompletion[];
}

export interface LessonCompletion {
  id?: number;
  lesson_id: string;
  profile_id: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  note?: any; // type unknown;
  videos?: []; // type unknown;
  slide_url?: any; // type unknown;
  course_id: string /* foreign key to course.id */;
  id: string /* primary key */;
  created_at: string;
  updated_at?: string;
  title: string; // type unknown;
  public?: boolean;
  lesson_at?: string;
  teacher_id?: string /* foreign key to profile.id */;
  is_unlocked?: boolean;
  call_url?: string;
  order?: number;
  course?: Course;
  profile?: Profile;
  lesson_completion: LessonCompletion[];
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

interface Tabs {
  id: number;
  name: string;
}
