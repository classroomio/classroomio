import { Context, Hono } from 'hono';
import { ZCertificateDownload, ZCourseDownloadContent } from '$src/types/course';

import { generateCertificate } from '$src/utils/certificate';
import { generateCoursePdf } from '$src/utils/course';
import { katexRouter } from '$src/routes/course/katex';
import { lessonRouter } from '$src/routes/course/lesson';
import { presignRouter } from '$src/routes/course/presign';
import { z } from 'zod';
import { getJsonBody } from '$src/utils/bodyParser';
import { getSupabase } from '$src/utils/supabase';
import { authMiddleware } from '$src/middlewares/auth';
import { responseHandler } from '$src/utils/responseHandler';

export const courseRouter = new Hono();
export const coursesRouter = new Hono();
const supabase = getSupabase();

courseRouter.route('/katex', katexRouter);
courseRouter.route('/lesson', lessonRouter);
courseRouter.route('/presign', presignRouter);

courseRouter.post('/download/certificate', async (c: Context) => {
  try {
    const data = await c.req.json();

    const validatedData = ZCertificateDownload.parse(data);

    const result = await generateCertificate(validatedData);

    c.header('Content-Type', 'application/pdf');
    c.header(
      'Content-Disposition',
      `attachment; filename="certificate-${validatedData.courseName}.pdf"`
    );

    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(result);
          controller.close();
        }
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        400
      );
    }

    console.error('Error generating certificate:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      500
    );
  }
});

courseRouter.post('/download/content', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = ZCourseDownloadContent.parse(data);

    const pdfBuffer = await generateCoursePdf(validatedData);

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
    console.error('Error generating course PDF:', error);
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

// --- get all courses, to follow the naming convention, this has to be plural
coursesRouter.post(
  '/',
  authMiddleware,
  getJsonBody<{ orgId: string; profileId: string }>(async (body, query, c) => {
    const { data, error } = await supabase.rpc('get_courses', {
      org_id_arg: body.orgId,
      profile_id_arg: body.profileId
    });

    if (error || !data) {
      return responseHandler(c, error);
    }

    const number = parseInt(query.number || '10', 10);
    const order = query.order === 'desc' ? 'desc' : 'asc';

    let filtered = [...data].sort((a, b) => {
      if (order === 'asc') {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });

    filtered = filtered.slice(0, number);

    return responseHandler(c, {
      data: filtered,
      status: 200,
      isError: false
    });
  })
);

// --- publish a course
courseRouter.patch(
  '/publish',
  authMiddleware,
  getJsonBody<{ courseId: string }>(async (body, _query, c) => {
    const { error: updateError } = await supabase
      .from('course')
      .update({ is_published: true })
      .eq('id', body.courseId);

    if (updateError) {
      return responseHandler(c, updateError);
    } else {
      return responseHandler(c, {
        message: 'Course successfully published',
        status: 200,
        isError: false
      });
    }
  })
);

// --- unpublish a course
courseRouter.patch(
  '/unpublish',
  authMiddleware,
  getJsonBody<{ courseId: string }>(async (body, _query, c) => {
    const { error: updateError } = await supabase
      .from('course')
      .update({ is_published: false })
      .eq('id', body.courseId);

    if (updateError) {
      return responseHandler(c, updateError);
    } else {
      return responseHandler(c, {
        message: 'Course successfully unpublished',
        status: 200,
        isError: false
      });
    }
  })
);

// --- update a course
courseRouter.patch(
  '/:courseId',
  authMiddleware,
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
  }>(async (body, query, c) => {
    const courseId = await query.courseId;
    if (!courseId) {
      return c.json({ error: 'Course ID is required' }, 400);
    }

    const { error: updateError } = await supabase.from('course').update(body).eq('id', courseId);

    if (updateError) {
      return responseHandler(c, updateError);
    } else {
      return responseHandler(c, {
        message: 'Course successfully updated',
        status: 200,
        isError: false
      });
    }
  })
);
