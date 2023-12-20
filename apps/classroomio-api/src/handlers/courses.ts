import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Course } from '../@types/base';
import { courseLimiter } from '../middleware/limiter.middleware';

const app = new Hono();

app.use('/*', courseLimiter);
app.get('/rating', (c) => {
  const k = c.get('c-api-key') as string;
  console.log(process.env.SUPABASE_ANON_KEY);
  return c.text('rating limited');
});

const schema = z.object({
  organisation_id: z.string({ required_error: 'Provide an organization ID' }),
  course_id: z.string({ required_error: 'Provide a course ID' })
});
// GET /course - takes in organisation_id and course_id
app.get(
  '/',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.text('Invalid!', 400);
    }
  }),
  async (c) => {
    const payload = c.req.valid('json');
    // const { data, error, status }: PostgrestSingleResponse<Course | null> = await fetchCourse(
    //   payload.course_id,
    //   payload.organisation_id
    // );

    return c.json({ data: 'data', error: 'err' });
  }
);
// GET /courses - takes in organisation_id
app.get('/courses', async (c) => {
  // const {}: PostgrestSingleResponse<Course[] | null> = await fetchCourses('aldsfadsf', 'adsfads');
  return c.json('courses');
});

// GET /course/lessons - takes in organisation_id and course_id
app.get(
  '/lessons',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.text('Invalid!', 400);
    }
  }),
  async (c) => {
    // const {}: PostgrestSingleResponse<Course[] | []> = await supabase
    //   .from('lesson')
    //   .select(
    //     `id, note, videos, slide_url, call_url, totalExercises:exercise(count), totalComments:lesson_comment(count), lesson_completion(id, profile_id, is_complete)`
    //   )
    //   .eq('id', 'courseId');
    return c.json('lesson');
  }
);
// GET /course/students - takes in organisation_id and course_id
app.get(
  '/students',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.text('Invalid!', 400);
    }
  }),
  (c) => c.json('students')
);

export default app;
