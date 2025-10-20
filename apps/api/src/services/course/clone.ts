import { getSupabase } from '$src/utils/supabase';
import type { Course, Lesson, LessonSection, GroupMember } from '$src/types/database';
import type { PostgrestError } from '@supabase/supabase-js';

const supabase = getSupabase();

// Constants
const QUESTION_TYPE_TEXTAREA = 2; // Paragraph question type
const ROLE_TUTOR = 2; // Tutor role ID

// Reusable deep select query for lessons with all nested relations
const LESSON_DEEP_SELECT = `
  *,
  exercise!exercise_lesson_id_fkey(
    id, title, description, due_by,
    question!question_exercise_id_fkey(
      *,
      option!option_question_id_fkey(*),
      question_type!question_question_type_id_fkey(id, label)
    )
  ),
  lesson_language!public_lesson_language_lesson_id_fkey(id, content, locale)
`;

interface FetchCourseDataResponse {
  data: Course | null;
  error: PostgrestError | null;
}

interface CloneGroupResponse {
  newCourse: Course;
}

interface CloneSectionsResponse {
  newSections: LessonSection[];
  sectionIdMap?: Map<string, string>;
}

interface CloneLessonsResponse {
  newLessons: Lesson[] | null;
}

interface AddGroupMemberParams {
  profile_id: string;
  email: string;
  group_id: string;
  role_id: number;
}

// fetches course data with backward compatibility for courses that is either V1 or V2
async function fetchCourseData(courseId: string): Promise<FetchCourseDataResponse> {
  const { data, error } = await supabase
    .from('course')
    .select(
      `
      *,
      lesson_section(
        id, title, order, created_at,
        lessons:lesson(${LESSON_DEEP_SELECT})
      ),
      lessons:lesson(${LESSON_DEEP_SELECT})
    `
    )
    .eq('id', courseId)
    .single();

  return { data, error };
}

async function addGroupMember(params: AddGroupMemberParams): Promise<{
  data: GroupMember[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase.from('groupmember').insert(params).select();
  return { data, error };
}

async function cloneGroupAndBasicCourse(
  course: Course,
  newTitle: string,
  userId: string,
  newDescription?: string,
  newSlug?: string,
  organizationId?: string
): Promise<CloneGroupResponse> {
  const { description } = course;
  const finalDescription = newDescription || description;
  const finalSlug = newSlug || null; // Use provided slug or null

  // 1. Create group
  const { data: newGroup, error: groupError } = await supabase
    .from('group')
    .insert({
      name: newTitle,
      description: finalDescription,
      organization_id: organizationId
    })
    .select();

  if (groupError) {
    console.error('Group creation error:', groupError);
    throw new Error(`Group creation failed: ${groupError.message}`);
  }

  if (!newGroup || newGroup.length === 0) {
    throw new Error('Group was not created successfully');
  }

  const { id: group_id } = newGroup[0];

  // Remove nested relations and metadata that shouldn't be inserted
  const { lessons, lesson_section, id, updated_at, created_at, ...courseData } = course as any;

  // 2. Create course with group_id
  const { data: newCourse, error: courseError } = await supabase
    .from('course')
    .insert({
      ...courseData,
      title: newTitle,
      description: finalDescription,
      slug: finalSlug,
      group_id
    })
    .select();

  if (courseError) {
    console.error('Course creation error:', courseError);
    throw new Error(`Course creation failed: ${courseError.message}`);
  }

  if (!newCourse || newCourse.length === 0) {
    throw new Error('Course was not created successfully');
  }

  // 3. Add group member (the user who is cloning)
  await addGroupMember({
    profile_id: userId,
    email: '', // Email will be fetched from profile
    group_id,
    role_id: ROLE_TUTOR
  });

  return {
    newCourse: newCourse[0]
  };
}

async function cloneLessonSections(
  sections: LessonSection[],
  courseId: string
): Promise<CloneSectionsResponse> {
  if (!sections || sections.length === 0) {
    return { newSections: [], sectionIdMap: undefined };
  }

  const clonedSections = sections
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
    .map((section) => ({
      title: section.title,
      order: section.order,
      course_id: courseId
    }));

  const { data: newSections } = await supabase
    .from('lesson_section')
    .insert(clonedSections)
    .select();

  // Map old section IDs to new section IDs
  const sectionIdMap = new Map<string, string>();
  sections.forEach((oldSection, index) => {
    if (newSections && newSections[index]) {
      sectionIdMap.set(oldSection.id, newSections[index].id);
    }
  });

  return { newSections: newSections || [], sectionIdMap };
}

async function cloneLessons(
  lessons: Lesson[],
  courseId: string,
  sectionIdMap?: Map<string, string>
): Promise<CloneLessonsResponse> {
  const clonedLessons = lessons
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
    .map((lesson, index) => ({
      call_url: lesson.call_url,
      course_id: courseId,
      section_id: lesson.section_id && sectionIdMap ? sectionIdMap.get(lesson.section_id) : null,
      is_unlocked: lesson.is_unlocked,
      lesson_at: new Date().toISOString(),
      note: lesson.note,
      order: lesson.order || index + 1,
      public: lesson.public,
      slide_url: lesson.slide_url,
      title: lesson.title,
      videos: lesson.videos
    }));

  const { data } = await supabase.from('lesson').insert(clonedLessons).select();

  const newLessons = data?.map((dataItem, dataIndex) => {
    return {
      ...dataItem,
      exercise: lessons[dataIndex].exercise,
      lesson_language: lessons[dataIndex].lesson_language
    };
  });

  return { newLessons };
}

async function cloneLessonLanguages(lessons: Lesson[]): Promise<boolean> {
  for (const lesson of lessons) {
    const { id: lessonId, lesson_language = [] } = lesson;

    if (!lesson_language || lesson_language.length === 0) continue;

    const clonedLanguages = lesson_language.map((lang: any) => ({
      lesson_id: lessonId,
      content: lang.content,
      locale: lang.locale
    }));

    const { error } = await supabase.from('lesson_language').insert(clonedLanguages).select();

    if (error) {
      console.error('Error cloning lesson languages:', error);
      throw error;
    }
  }

  return true;
}

async function cloneExercises(lessons: Lesson[]): Promise<boolean> {
  // Clone exercises, questions, and options
  for (const lesson of lessons) {
    const { id: lessonId, exercise = [] } = lesson;

    // Exercises
    for (const exerciseItem of exercise) {
      const { title, description, questions = [] } = exerciseItem;

      // Insert exercise
      const { data } = await supabase
        .from('exercise')
        .insert({
          description,
          due_by: new Date().toISOString(),
          lesson_id: lessonId,
          title
        })
        .select();

      const newExercise = Array.isArray(data) ? data[0] : data;

      if (!newExercise) continue;

      // Questions
      for (const question of questions) {
        const { options = [] } = question;

        // Insert question
        const { data: questionData } = await supabase
          .from('question')
          .insert({
            name: question.name,
            title: question.title,
            points: question.points,
            order: question.order,
            question_type_id: question.question_type_id,
            exercise_id: newExercise.id
          })
          .select();

        const newQuestion = Array.isArray(questionData) ? questionData[0] : questionData;

        if (!newQuestion) continue;

        // Options: Don't map options for 'Paragraph' questions
        if (QUESTION_TYPE_TEXTAREA !== newQuestion.question_type_id && options.length > 0) {
          const newOptions = options.map((option: any) => ({
            value: option.value,
            label: option.label,
            is_correct: option.is_correct,
            question_id: newQuestion.id
          }));

          // Insert options in batch
          await supabase.from('option').insert(newOptions).select();
        }
      }
    }
  }

  return true;
}

export async function cloneCourse(
  courseId: string,
  newTitle: string,
  userId: string,
  newDescription?: string,
  newSlug?: string,
  organizationId?: string
): Promise<Course> {
  const { data: course, error } = await fetchCourseData(courseId);

  if (error) {
    console.error('Error when cloning', error);
    throw error;
  }

  if (!course) {
    throw new Error('Course not found');
  }

  // 1. Clone course and group
  const { newCourse } = await cloneGroupAndBasicCourse(
    course,
    newTitle,
    userId,
    newDescription,
    newSlug,
    organizationId
  );

  let sectionIdMap: Map<string, string> | undefined = undefined;
  let allLessons: Lesson[] = [];

  // 2. Clone sections if this is a V2 course with sections
  // @ts-ignore - lesson_section comes from the query
  if (course.lesson_section && course.lesson_section.length > 0) {
    // @ts-ignore
    const { sectionIdMap: map } = await cloneLessonSections(course.lesson_section, newCourse.id);
    sectionIdMap = map;

    // Collect all lessons from sections
    // @ts-ignore
    course.lesson_section.forEach((section: any) => {
      if (section.lessons && section.lessons.length > 0) {
        allLessons = [...allLessons, ...section.lessons];
      }
    });
  }

  // 3. Also add lessons that are not in sections (V1 courses or orphaned lessons)
  // @ts-ignore - lessons comes from the query
  if (course.lessons && course.lessons.length > 0) {
    // @ts-ignore
    const orphanedLessons = course.lessons.filter(
      (lesson: Lesson) => !lesson.section_id || !sectionIdMap
    );
    allLessons = [...allLessons, ...orphanedLessons];
  }

  // 4. Clone lessons
  const { newLessons } = await cloneLessons(allLessons, newCourse.id, sectionIdMap);

  // 5. Clone lesson languages
  await cloneLessonLanguages(newLessons || []);

  // 6. Clone exercises, questions, and options
  await cloneExercises(newLessons || []);

  return newCourse;
}
