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

// TODO: for reference
// The relationship between a course and an organization is the group_id: course.group_id = group.organization_id
// The relationship between a lesson and an organization is the course_id: lesson.course_id = course.id And course.group_id = group.organization_id

// TODO LATER: So before returning a course or lesson we need to check for this things first

const ALLOWED_COURSE_SORT_FIELDS = ['created_at', 'title', 'updated_at', 'cost'];
const ALLOWED_LESSON_SORT_FIELDS = ['created_at', 'title', 'order', 'updated_at'];

// Helper to get profile ID from organization member
export async function getProfileIdFromOrg(organizationId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('organizationmember')
      .select('profile_id')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) return null;
    return data.profile_id;
  } catch (error) {
    console.error('Error getting profile ID:', error);
    return null;
  }
}
// I am thinking as a fallback we might have to use the standard supabase query
// Method 1: Using RPC
export async function getCoursesRPC(
  organizationId: string,
  profileId: string,
  pagination: TPaginationQuery
): Promise<{ data: Course[]; total: number }> {
  try {
    const { data, error, count } = await supabase
      .rpc('get_courses', {
        org_id_arg: organizationId,
        profile_id_arg: profileId
      })
      .select('*')
      .range(
        calculateOffset(pagination.page, pagination.limit),
        calculateOffset(pagination.page, pagination.limit) + pagination.limit - 1
      );

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching courses via RPC:', error);
    throw error;
  }
}

// Method 2: Using Standard Query
export async function getCoursesStandard(
  organizationId: string,
  profileId: string,
  pagination: TPaginationQuery
): Promise<{ data: Course[]; total: number }> {
  try {
    const offset = calculateOffset(pagination.page, pagination.limit);

    const { data, error, count } = await supabase
      .from('course')
      .select(
        `
        id,
        title,
        slug,
        description,
        logo,
        banner_image,
        cost,
        currency,
        is_published,
        type,
        created_at,
        organization_id,
        lessons:lesson(count),
        students:groupmember!inner(count),
        progress:lesson_completion!inner(count)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')
      .eq('groupmember.profile_id', profileId)
      .eq('groupmember.role_id', 3)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1);

    if (error) throw error;

    const courses =
      data?.map((course) => ({
        ...course,
        total_lessons: course.lessons?.[0]?.count || 0,
        total_students: course.students?.[0]?.count || 0,
        progress_rate: course.progress?.[0]?.count || 0,
        org_id: course.organization_id
      })) || [];

    return {
      data: courses as unknown as Course[],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching courses via standard query:', error);
    throw error;
  }
}

// Main getCourses function that uses either method
export async function getCourses(
  organizationId: string,
  pagination: TPaginationQuery,
  useRPC: boolean = true
): Promise<{ data: Course[]; total: number }> {
  console.log('organizationId', organizationId);
  const profileId = await getProfileIdFromOrg(organizationId);
  if (!profileId) throw new Error('Profile not found for organization');

  return useRPC
    ? getCoursesRPC(organizationId, profileId, pagination)
    : getCoursesStandard(organizationId, profileId, pagination);
}

export async function getCourse(courseId: string, organizationId: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('course')
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
      .from('course')
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

// This feels completely wrong
// should i be using groupmember instead of organizationmember
export async function grantCourseAccess(
  courseId: string,
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    // Verify course belongs to organization and is published
    const { data: course, error: courseError } = await supabase
      .from('course')
      .select('id, is_published, group_id')
      .eq('id', courseId)
      // .eq('organization.id', organizationId)
      .single();

    if (courseError || !course || !course.is_published) {
      return false;
    }

    // Verify user exists and belongs to organization
    const { data: userOrg, error: userError } = await supabase
      .from('organizationmember')
      .select('organization_id')
      .eq('profile_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (userError || !userOrg) {
      return false;
    }

    // I am supposed to simply add the user to the course
    // each course has a group, and each group has a member

    const { error } = await supabase.from('groupmember').upsert({
      group_id: course.group_id,
      profile_id: userId,
      role_id: 3
    });
    console.log('error', error);
    // TODO: add a check to see if the user is already a member of the course
    // if they are, then we should not add them again
    // if they are not, then we should add them

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
    const offset = calculateOffset(pagination.page, pagination.limit);

    let query = supabase
      .from('lesson')
      .select(
        `
        id,
        course_id,
        section_id,
        title,
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
        note:lesson_language!inner(
          id,
          content,
          locale,
          lesson_id
        ),
        course!inner(group_id)
      `,
        { count: 'exact' }
      )
      .eq('course_id', courseId);
    // .eq('organization.id', organizationId);

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

    if (error || !data) {
      console.error('Error fetching lessons:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data as unknown as Lesson[],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return { data: [], total: 0 };
  }
}

export async function getLesson(lessonId: string, organizationId: string): Promise<Lesson | null> {
  try {
    const { data, error } = await supabase
      .from('lesson')
      .select(
        `
        id,
        course_id,
        section_id,
        title,
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
        note:lesson_language!inner(
          id,
          content,
          locale,
          lesson_id
        ),
        course!inner(group_id)
      `
      )
      .eq('id', lessonId)
      // .eq('organization.id', organizationId)
      .single();

    if (error || !data) return null;

    return {
      data
    } as unknown as Lesson;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export async function updateLesson(
  lessonId: string,
  organizationId: string,
  updates: TLessonUpdate
): Promise<Lesson | null> {
  try {
    // Validate updates with Zod schema
    const validatedUpdates = ZLessonUpdate.parse(updates);

    const { data, error } = await supabase
      .from('lesson')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      // .eq('organization.id', organizationId)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as Lesson;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

export async function toggleLessonLock(
  lessonId: string,
  organizationId: string,
  isLocked: boolean
): Promise<boolean> {
  try {
    const lesson = await updateLesson(lessonId, organizationId, { is_unlocked: isLocked });
    return !!lesson;
  } catch (error) {
    console.error('Error toggling lesson lock:', error);
    return false;
  }
}
