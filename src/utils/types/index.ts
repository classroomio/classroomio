export * from './config';
export * from './dashboard';

export interface CurrentSessionType {
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

export interface UserType {
  openAuthModal: boolean;
  fetchingUser: boolean | null;
  isLoggedIn: boolean;
  currentSession: CurrentSessionType | null;
  expiresAt: number;
}

export interface Organization {
  id: string /* primary key */;
  name: string;
}

export interface Profile {
  id: string /* primary key */;
  fullname: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  email?: string;
  can_add_course?: boolean;
}

export interface Question_type {
  id: number /* primary key */;
  label: string;
  created_at?: string;
  updated_at?: string;
  typename?: string;
}

export interface Submissionstatus {
  id: number /* primary key */;
  label: string;
  updated_at?: string;
}

export interface Group {
  id: string /* primary key */;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string /* foreign key to organization.id */;
  organization?: Organization;
}

export interface Role {
  type: string;
  description?: string;
  id: number /* primary key */;
  updated_at?: string;
  created_at?: string;
}

export interface Waitinglist {
  id: number /* primary key */;
  email: string;
  created_at?: string;
}

export interface Course {
  created_at?: string;
  description: string;
  group_id?: string /* foreign key to group.id */;
  group?: Group;
  id: string /* primary key */;
  is_template?: boolean;
  lessons: Lesson[];
  logo?: string;
  organization_id?: string /* foreign key to organization.id */;
  organization?: Organization;
  overview?: string;
  title: string;
  updated_at?: string;
}

export interface Groupmember {
  id: string /* primary key */;
  group_id: string /* foreign key to group.id */;
  role_id: number /* foreign key to role.id */;
  profile_id?: string /* foreign key to profile.id */;
  email?: string;
  created_at?: string;
  assigned_student_id?: string;
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

export interface Lesson {
  call_url?: string;
  course_id: string /* foreign key to course.id */;
  created_at: string;
  exercise?: Exercise[];
  id: string /* primary key */;
  is_complete?: boolean;
  lesson_at?: string;
  note?: string;
  order: number;
  profile?: Profile;
  public?: boolean;
  slide_url?: string;
  teacher_id?: string /* foreign key to profile.id */;
  title: string;
  updated_at?: string;
  video_url?: string;
}

export interface Exercise {
  created_at?: string;
  description?: string;
  due_by?: string;
  id: string /* primary key */;
  lesson_id: string /* foreign key */;
  questions?: Question[];
  title: string;
  updated_at?: string;
}

export interface Question {
  created_at?: string;
  exercise_id: string /* foreign key to exercise.id */;
  id: number /* primary key */;
  name?: string;
  options: Option[];
  order?: number;
  points?: string;
  question_type_id: number /* foreign key to question_type.id */;
  title: string;
  updated_at?: string;
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
  created_at?: string;
  id?: number /* primary key */;
  is_correct: boolean;
  is_dirty?: boolean;
  label: string;
  question_id: number /* foreign key to question.id */;
  question?: Question;
  updated_at?: string;
  value?: string;
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
