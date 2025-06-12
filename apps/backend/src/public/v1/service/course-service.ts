import { getSupabase } from '$src/utils/supabase';
import {
  ZCourseUpdate,
  ZLessonUpdate,
  type TCourseUpdate,
  type TLessonUpdate,
  type TLessonCreate
} from '$src/public/utils/validations';
import { TPaginationQuery, calculateOffset } from '$src/public/utils/pagination';

const supabase = getSupabase();

const ALLOWED_COURSE_SORT_FIELDS = ['created_at', 'title', 'updated_at', 'cost'];
const ALLOWED_LESSON_SORT_FIELDS = ['created_at', 'title', 'order', 'updated_at'];

export async function getCourses(
  organizationId: string,
  pagination: TPaginationQuery
): Promise<{ data: Course[]; total: number }> {
  try {
    // Calculate the range based on pagination
    const offset = calculateOffset(pagination.page, pagination.limit);

    // Build the query
    let query = supabase
      .from('courses')
      .select(
        `
        id,
        organization_id,
        title,
        description,
        type,
        version,
        overview,
        slug,
        logo,
        banner_image,
        cost,
        currency,
        status,
        is_published,
        is_certificate_downloadable,
        certificate_theme,
        progress_rate,
        total_lessons,
        total_students,
        metadata,
        created_at,
        updated_at,
        students_count:course_access(count),
        lessons_count:lessons(count),
        lesson_section (
          id,
          title,
          order,
          created_at
        ),
        lessons:lesson (
          id,
          title,
          public,
          lesson_at,
          is_unlocked,
          order,
          created_at,
          section_id,
          note,
          videos,
          slide_url,
          call_url,
          teacher_id,
          totalExercises:exercise(count),
          lesson_completion(
            id,
            profile_id,
            is_complete,
            created_at,
            updated_at
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE');

    // Apply sorting if valid sort field is provided
    if (pagination.sort_by && ALLOWED_COURSE_SORT_FIELDS.includes(pagination.sort_by)) {
      query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' });
    } else {
      // Default sorting
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data.map((course) => ({
        ...course,
        students_count: course.students_count?.[0]?.count || 0,
        lessons_count: course.lessons_count?.[0]?.count || 0
      })),
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function getCourse(courseId: string, organizationId: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        id,
        organization_id,
        title,
        description,
        type,
        version,
        overview,
        slug,
        logo,
        banner_image,
        cost,
        currency,
        status,
        is_published,
        is_certificate_downloadable,
        certificate_theme,
        progress_rate,
        total_lessons,
        total_students,
        metadata,
        created_at,
        updated_at,
        students_count:course_access(count),
        lessons_count:lessons(count),
        lesson_section (
          id,
          title,
          order,
          created_at
        ),
        lessons:lesson (
          id,
          title,
          public,
          lesson_at,
          is_unlocked,
          order,
          created_at,
          section_id,
          note,
          videos,
          slide_url,
          call_url,
          teacher_id,
          totalExercises:exercise(count),
          lesson_completion(
            id,
            profile_id,
            is_complete,
            created_at,
            updated_at
          )
        )
      `
      )
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      students_count: data.students_count?.[0]?.count || 0,
      lessons_count: data.lessons_count?.[0]?.count || 0
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

export async function updateCourse(
  courseId: string,
  organizationId: string,
  updates: TCourseUpdate
): Promise<Course | null> {
  try {
    // Validate updates with Zod schema
    const validatedUpdates = ZCourseUpdate.parse(updates);

    const { data, error } = await supabase
      .from('courses')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function grantCourseAccess(
  courseId: string,
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    // Verify course belongs to organization and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_published')
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .single();

    if (courseError || !course || !course.is_published) {
      return false;
    }

    // Verify user exists and belongs to organization
    const { data: userOrg, error: userError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (userError || !userOrg) {
      return false;
    }

    const { error } = await supabase.from('course_access').upsert({
      course_id: courseId,
      user_id: userId,
      granted_at: new Date().toISOString()
    });

    return !error;
  } catch (error) {
    console.error('Error granting course access:', error);
    return false;
  }
}

export async function getLessons(
  courseId: string,
  organizationId: string,
  pagination: TPaginationQuery
): Promise<{ data: Lesson[]; total: number }> {
  try {
    // Calculate the range based on pagination
    const offset = calculateOffset(pagination.page, pagination.limit);

    // Build the query
    let query = supabase
      .from('lessons')
      .select(
        `
        id,
        course_id,
        section_id,
        title,
        note,
        videos,
        slide_url,
        public,
        lesson_at,
        teacher_id,
        is_unlocked,
        call_url,
        order,
        created_at,
        updated_at,
        totalExercises:exercise(count),
        lesson_completion(
          id,
          profile_id,
          is_complete,
          created_at,
          updated_at
        ),
        courses!inner(organization_id)
      `,
        { count: 'exact' }
      )
      .eq('course_id', courseId)
      .eq('courses.organization_id', organizationId);

    // Apply sorting if valid sort field is provided
    if (pagination.sort_by && ALLOWED_LESSON_SORT_FIELDS.includes(pagination.sort_by)) {
      query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' });
    } else {
      // Default sorting by order
      query = query.order('order', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error || !data) return { data: [], total: 0 };
    return {
      data: data as unknown as Lesson[],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return { data: [], total: 0 };
  }
}

export async function getLesson(
  // courseId: string,
  lessonId: string,
  organizationId: string
): Promise<Lesson | null> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(
        `
        id,
        course_id,
        section_id,
        title,
        note,
        videos,
        slide_url,
        public,
        lesson_at,
        teacher_id,
        is_unlocked,
        call_url,
        order,
        created_at,
        updated_at,
        totalExercises:exercise(count),
        lesson_completion(
          id,
          profile_id,
          is_complete,
          created_at,
          updated_at
        ),
        courses!inner(organization_id)
      `
      )
      .eq('id', lessonId)
      // .eq('course_id', courseId)
      .eq('courses.organization_id', organizationId)
      .single();

    if (error || !data) return null;
    return data as unknown as Lesson;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export async function updateLesson(
  // courseId: string,
  lessonId: string,
  organizationId: string,
  updates: TLessonUpdate
): Promise<Lesson | null> {
  try {
    // Validate updates with Zod schema
    const validatedUpdates = ZLessonUpdate.parse(updates);

    const { data, error } = await supabase
      .from('lessons')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      // .eq('course_id', courseId)
      .eq('courses.organization_id', organizationId)
      .select(
        `
        *,
        courses!inner(organization_id)
      `
      )
      .single();

    if (error) throw error;
    return data as unknown as Lesson;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

export async function toggleLessonLock(
  // courseId: string,
  lessonId: string,
  organizationId: string,
  isLocked: boolean
): Promise<boolean> {
  try {
    const lesson = await updateLesson(lessonId, organizationId, { is_locked: isLocked });
    return !!lesson;
  } catch (error) {
    console.error('Error toggling lesson lock:', error);
    return false;
  }
}

export async function createLesson(
  courseId: string,
  organizationId: string,
  lessonData: TLessonCreate
): Promise<Lesson | null> {
  try {
    // First verify the course belongs to the organization
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .single();

    if (courseError || !course) {
      return null;
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        ...lessonData,
        course_id: courseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Lesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
}
