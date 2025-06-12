import { getSupabase } from '$src/utils/supabase';

    const supabase = getSupabase();

    export async function getCourses(organizationId: string): Promise<Course[]> {
        try {
          const { data, error } = await supabase
            .from('courses')
            .select(`
              *,
              students_count:course_access(count),
              lessons_count:lessons(count)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
    
          if (error) {
            throw error;
          }
    
          return data.map(course => ({
            ...course,
            students_count: course.students_count?.[0]?.count || 0,
            lessons_count: course.lessons_count?.[0]?.count || 0
          }));
        } catch (error) {
          console.error('Error fetching courses:', error);
          throw error;
        }
      }
    
      export async function getCourse(courseId: string, organizationId: string): Promise<Course | null> {
        try {
          const { data, error } = await supabase
            .from('courses')
            .select(`
              *,
              students_count:course_access(count),
              lessons_count:lessons(count)
            `)
            .eq('id', courseId)
            .eq('organization_id', organizationId)
            .single();
    
          if (error || !data) {
            return null;
          }
    
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
    
      export async function updateCourse(courseId: string, organizationId: string, updates: Partial<Course>): Promise<Course | null> {
        try {
          const { data, error } = await supabase
            .from('courses')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', courseId)
            .eq('organization_id', organizationId)
            .select()
            .single();
    
          if (error) {
            throw error;
          }
    
          return data;
        } catch (error) {
          console.error('Error updating course:', error);
          throw error;
        }
      }
    
      export async function grantCourseAccess(courseId: string, userId: string, organizationId: string): Promise<boolean> {
        try {
          // Verify course belongs to organization
          const course = await getCourse(courseId, organizationId);
          if (!course) {
            return false;
          }
    
          const { error } = await supabase
            .from('course_access')
            .upsert({
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
    
    
    
       export async function getLesson(lessonId: string, organizationId: string): Promise<Lesson | null> {
        try {
          const { data, error } = await supabase
            .from('lessons')
            .select(`
              *,
              courses!inner(organization_id)
            `)
            .eq('id', lessonId)
            .eq('courses.organization_id', organizationId)
            .single();
    
          if (error || !data) {
            return null;
          }
    
          return data;
        } catch (error) {
          console.error('Error fetching lesson:', error);
          return null;
        }
      }
    
       export async function updateLesson(lessonId: string, organizationId: string, updates: Partial<Lesson>): Promise<Lesson | null> {
        try {
          const { data, error } = await supabase
            .from('lessons')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', lessonId)
            .eq('courses.organization_id', organizationId)
            .select(`
              *,
              courses!inner(organization_id)
            `)
            .single();
    
          if (error) {
            throw error;
          }
    
          return data;
        } catch (error) {
          console.error('Error updating lesson:', error);
          throw error;
        }
      }
    
       export async function toggleLessonLock(lessonId: string, organizationId: string, isLocked: boolean): Promise<boolean> {
        try {
          const lesson = await updateLesson(lessonId, organizationId, { is_locked: isLocked });
          return !!lesson;
        } catch (error) {
          console.error('Error toggling lesson lock:', error);
          return false;
        }
      }
    