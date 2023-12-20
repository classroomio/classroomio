export interface Review {
  id: number;
  hide: boolean;
  name: string;
  avatar_url: string;
  rating: number;
  created_at: number;
  description: string;
}

export interface Tabs {
  id: number;
  name: string;
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

export interface Role {
  type: any; // type unknown;
  description?: any; // type unknown;
  id: number /* primary key */;
  updated_at?: string;
  created_at?: string;
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

export interface CourseMetadata {
  requirements?: string;
  description?: string;
  goals?: string;
  videoUrl?: "";
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
  allowNewStudent: boolean;
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

export interface Lesson {
  note?: any; // type unknown;
  videos?: []; // type unknown;
  slide_url?: any; // type unknown;
  course_id: string /* foreign key to course.id */;
  id: string /* primary key */;
  created_at?: string;
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

export interface LessonCompletion {
  id?: number;
  lesson_id: string;
  profile_id: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string /* primary key */;
  name: any; // type unknown;
}

export interface Course {
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