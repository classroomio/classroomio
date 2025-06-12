interface Organization {
    id: string;
    name: string;
    slug: string;
    api_key?: string;
    created_at: string;
    updated_at: string;
  }
  
  interface Course {
    id: string;
    organization_id: string;
    title: string;
    slug: string;
    banner_image?: string;
    logo?: string;
    cost?: number;
    status:'ACTIVE'| 'DELETED';
    type:'SELF_PACED' | 'LIVE_CLASS'
    description?: string;
    is_published: boolean;
    students_count: number;
    lessons_count: number;
    created_at: string;
    updated_at: string;
  }
  
  interface Lesson {
    id: string;
    course_id: string;
    title: string;
    content?: string;
    video_url?: string;
    duration?: number;
    is_locked: boolean;
    published: boolean;
    created_at: string;
    updated_at: string;
  }
  
  interface CourseAccess {
    id: string;
    course_id: string;
    user_id: string;
    granted_at: string;
    expires_at?: string;
  }
  
  interface ApiUser {
    id: string;
    organization_id: string;
    role: 'admin' | 'instructor' | 'readonly';
  }
  