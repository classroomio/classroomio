import { Context, Hono } from 'hono';
import { ZCertificateDownload, ZLessonDownloadContent } from '$src/types/course/lesson';

import { generateLessonPdf } from '$src/utils/lesson';
import { getJsonBody } from '$src/utils/bodyParser';
import { getSupabase } from '$src/utils/supabase';
import { authMiddleware } from '$src/middlewares/auth';

export const lessonRouter = new Hono();
const supabase = getSupabase();

lessonRouter.post('/download/pdf', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = ZLessonDownloadContent.parse(data);

    const pdfBuffer = await generateLessonPdf(validatedData);

    c.header('Content-Type', 'application/pdf');
    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(pdfBuffer);
          controller.close();
        }
      })
    );
  } catch (error) {
    console.error('Error generating lesson PDF:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      400
    );
  }
});

// --- get lesson by id
lessonRouter.post(
  '/',
  authMiddleware,
  getJsonBody<{ lessonId: string }>(async (body, _query, c) => {
    const { data, error } = await supabase
      .from('lesson')
      .select('*')
      .eq('id', body.lessonId)
      .single();
    if (error || !data) {
      return c.json({ success: false, error: error.message, details: error }, 500);
    } else {
      return c.json({ success: true, data }, 200);
    }
  })
);

// --- lock a lesson
lessonRouter.patch(
  '/lock',
  authMiddleware,
  getJsonBody<{ lessonId: string }>(async (body, _query, c) => {
    const { error: updateError } = await supabase
      .from('lesson')
      .update({ is_unlocked: false })
      .eq('id', body.lessonId);

    if (updateError) {
      return c.json({ success: false, error: updateError.message, details: updateError }, 500);
    }
    return c.json({ success: true, message: 'Lesson successfully locked' }, 200);
  })
);

// --- unlock a lesson
lessonRouter.patch(
  '/unlock',
  authMiddleware,
  getJsonBody<{ lessonId: string }>(async (body, _query, c) => {
    const { error: updateError } = await supabase
      .from('lesson')
      .update({ is_unlocked: true })
      .eq('id', body.lessonId);

    if (updateError) {
      return c.json({ success: false, error: updateError.message, details: updateError }, 500);
    }
    return c.json({ success: true, message: 'Lesson successfully unlocked' }, 200);
  })
);

// --- update lesson content
lessonRouter.patch(
  ':lessonId',
  authMiddleware,
  getJsonBody<{
    video_url?: string;
    slide_url?: string;
    title?: string;
    videos?: any;
    content?: string;
    locale?: string;
  }>(async (body, query, c) => {
    const lessonId = await query.lessonId;
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
      return c.json(
        { success: false, error: contentResult.error?.message || noteResult.error?.message },
        500
      );
    }
    return c.json({ success: true, message: 'Lesson successfully updated' }, 200);
  })
);
