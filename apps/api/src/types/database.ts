// Database types for course cloning

export interface Course {
  id: string;
  title: string;
  description: string;
  type: string;
  version: 'V1' | 'V2';
  overview?: string;
  created_at: string;
  updated_at: string;
  group_id?: string;
  is_template?: boolean;
  organization_id?: string;
  logo?: string;
  slug?: string;
  metadata?: Record<string, unknown>;
  cost?: number;
  currency?: string;
  is_certificate_downloadable?: boolean;
  certificate_theme?: string;
  status?: string;
  is_published?: boolean;
  lesson_section?: LessonSection[];
  lessons?: Lesson[];
}

export interface LessonSection {
  id: string;
  title: string;
  order: number;
  course_id: string;
  created_at: string;
  updated_at?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  note?: string;
  videos?: unknown[];
  slide_url?: string;
  course_id: string;
  section_id?: string;
  created_at: string;
  updated_at?: string;
  public?: boolean;
  lesson_at?: string;
  teacher_id?: string;
  is_unlocked?: boolean;
  call_url?: string;
  order?: number;
  exercise?: Exercise[];
  lesson_language?: LessonLanguage[];
}

export interface LessonLanguage {
  id: number;
  content: string;
  lesson_id: string;
  locale: 'en' | 'hi' | 'fr' | 'pt' | 'de' | 'vi' | 'ru' | 'es' | 'pl' | 'da';
}

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  lesson_id?: string;
  created_at?: string;
  updated_at?: string;
  due_by?: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  question_type_id: number;
  title: string;
  name?: string;
  points?: number;
  order?: number;
  created_at?: string;
  updated_at?: string;
  exercise_id: string;
  question_type?: QuestionType;
  options?: Option[];
}

export interface QuestionType {
  id: number;
  label: string;
  typename?: string;
}

export interface Option {
  id: number;
  label: string;
  is_correct: boolean;
  question_id: number;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  role_id: number;
  profile_id?: string;
  email?: string;
  created_at?: string;
  assigned_student_id?: string;
}

export interface Profile {
  id: string;
  fullname: string;
  username: string;
  avatar_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Response types
export interface CloneCourseResponse {
  success: boolean;
  course: Course;
}

export interface CloneCourseErrorResponse {
  error: string;
  details?: string;
}

