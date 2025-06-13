import { Hono } from 'hono';
import { getServerSupabase } from '../../utils/superbase.server';
import { authMiddleware } from '../controllers/authMiddleware';
import { getJsonBody } from '../utils/bodyParser';

const app = new Hono();
const supabase = getServerSupabase();

app.get('/', (c) => {
  return c.json({ data: 'Hello Hono!' }, 200);
});

// app.use('*', authMiddleware);

// get all courses in an organization
app.post(
  '/courses',
  getJsonBody<{ orgId: string; profileId: string }>(async (body, c) => {
    const { data, error } = await supabase.rpc('get_courses', {
      org_id_arg: body.orgId,
      profile_id_arg: body.profileId
    });
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data: data?.[0] }, 200);
  })
);

// can give student access to a course
app.post(
  '/course/access',
  getJsonBody<{ courseId: string; profileId: string }>(async (body, c) => {
    const { data, error } = await supabase.rpc('give_course_access', {
      course_id_arg: body.courseId,
      profile_id_arg: body.profileId
    });
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data }, 200);
  })
);

// publish a course
app.patch(
  '/course/publish',
  getJsonBody<{ courseId: string }>(async (body, c) => {
    const { error: updateError } = await supabase
      .from('course')
      .update({ is_published: true })
      .eq('id', body.courseId);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
    return c.json({ data: { 'course publish status updated': true } }, 200);
  })
);

// unpublish a course
app.patch(
  '/course/unpublish',
  getJsonBody<{ courseId: string }>(async (body, c) => {
    const { error: updateError } = await supabase
      .from('course')
      .update({ is_published: false })
      .eq('id', body.courseId);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
    return c.json({ data: { 'course publish status updated': false } }, 200);
  })
);

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// update course
app.patch(
  '/courses/:courseId',
  getJsonBody<{
    title?: string;
    description?: string;
    overview?: string;
    logo?: string;
    cost?: number;
    currency?: string;
    banner_image?: string;
    certificate_theme?: string;
    status?: string;
    type?: string;
    is_template?: boolean;
    is_certificate_downloadable?: boolean;
  }>(async (body, c) => {
    const courseId = await c.req.param('courseId');
    if (!courseId) {
      return c.json({ error: 'Course ID is required' }, 400);
    }

    const { error: updateError } = await supabase
      .from('course')
      .update(body)
      .eq('id', courseId)
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
    return c.json({ data: { 'course content updated': true } }, 200);
  })
);

// get lesson info by id
app.post(
  '/lesson',
  getJsonBody<{ lessonId: string }>(async (body, c) => {
    const { data, error } = await supabase
      .from('lesson')
      .select('*')
      .eq('id', body.lessonId)
      .single();
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data }, 200);
  })
);

// lock a lesson for a course
app.patch(
  '/lesson/lock',
  getJsonBody<{ lessonId: string }>(async (body, c) => {
    const { error: updateError } = await supabase
      .from('lesson')
      .update({ is_unlocked: false })
      .eq('id', body.lessonId);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
    return c.json({ data: { 'Lesson status updated': true } }, 200);
  })
);

// unlock a lesson for a course
app.patch(
  '/lesson/unlock',
  getJsonBody<{ lessonId: string }>(async (body, c) => {
    const { error: updateError } = await supabase
      .from('lesson')
      .update({ is_unlocked: true })
      .eq('id', body.lessonId);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
    return c.json({ data: { 'Lesson status updated': false } }, 200);
  })
);

// update lesson content
app.patch(
  '/lessons/:lessonId',
  getJsonBody<{
    video_url?: string;
    slide_url?: string;
    title?: string;
    videos?: any;
    content?: string;
    locale?: string;
  }>(async (body, c) => {
    const lessonId = await c.req.param('lessonId');
    const { video_url, slide_url, title, videos, content, locale = 'en' } = body;

    if (!lessonId) {
      return c.json({ error: 'Lesson ID is required' }, 400);
    }

    const updateLessonContent = await supabase
      .from('lesson')
      .update({
        video_url,
        slide_url,
        title,
        videos
      })
      .eq('id', lessonId);

    const updateLessonNote = await supabase
      .from('lesson_language')
      .update({
        content,
        locale
      })
      .eq('lesson_id', lessonId);

    const [contentResult, noteResult] = await Promise.all([updateLessonContent, updateLessonNote]);

    if (contentResult.error || noteResult.error) {
      return c.json({ error: contentResult.error?.message || noteResult.error?.message }, 500);
    }
    return c.json({ data: { 'lesson content updated': true } }, 200);
  })
);

export default app;
