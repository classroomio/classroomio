import { json } from '@sveltejs/kit';
import type { Course } from '$lib/utils/types';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { createScormZip, handleScormExport } from '$lib/components/Course/functions';

const supabase = getServerSupabase();

const query = `
    id,
    title,
    type,
    description,
    overview,
    logo,
    is_published,
    version,
    group(*,
      members:groupmember(*,
        profile(*)
      )
    ),
    slug,
    cost,
    currency,
    metadata,
    is_certificate_downloadable,
    certificate_theme,
    lesson_section(id, title, order, created_at),
    lessons:lesson(
      id, title, public, lesson_at, is_unlocked, order, created_at, section_id,
      note, videos, slide_url, call_url, 
      totalExercises:exercise(count), 
      totalComments:lesson_comment(count),
      exercises:exercise(
        *,
        questions:question(
          *,
          options:option(id, label, is_correct, value)
        )
      ),
      profile:teacher_id(id, avatar_url, fullname),
      lesson_completion(id, profile_id, is_complete)
    ),
    attendance:group_attendance(*),
    polls:apps_poll(status)
  `;

export async function POST({ url }) {
  const courseId = url.searchParams.get('courseId');

  if (!courseId) {
    return json({ success: false, message: 'Course id is required', ok: false }, { status: 400 });
  }

  try {
    console.log('--- starting SCORM export for course:', courseId);

    const { data, error } = await getCourseData(courseId);

    if (error) {
      console.error('error fetching course from supabase:', error);
      return json({ success: false, message: error.message, ok: false }, { status: 500 });
    }

    if (!data || !data.length) {
      return json({ success: false, message: 'course not found', ok: false }, { status: 404 });
    }

    console.log('--- generating SCORM export...');
    const exportResponse = await handleScormExport(data[0] as unknown as Course);

    if (!exportResponse) {
      return json(
        { success: false, message: 'failed to generate SCORM export', ok: false },
        { status: 500 }
      );
    }

    console.log('--- creating ZIP...');
    const zipBlob = await createScormZip(exportResponse);

    // Convert Blob to ArrayBuffer then to Uint8Array for proper streaming
    const arrayBuffer = await zipBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate filename
    const courseName = exportResponse.packageInfo?.name || 'scorm-course';
    const sanitizedName = courseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${sanitizedName}-${Date.now()}.zip`;

    console.log('✅ Sending ZIP file:', filename, 'Size:', uint8Array.length, 'bytes');

    // Return ZIP file as download with proper headers
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
        'Cache-Control': 'no-store',
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    });

    // --- to test in frontend
    // return json(
    //   {
    //     success: true,
    //     message: 'SCORM export generated successfully',
    //     exportResponse,
    //     ok: true
    //   },
    //   { status: 200 }
    // );
  } catch (error) {
    console.error('❌ Server error:', error);
    return json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        ok: false
      },
      { status: 500 }
    );
  }
}

async function getCourseData(courseId: string) {
  console.log('fetching course data for scorm export', courseId);

  const { data, error } = await supabase.from('course').select(query).eq('id', courseId);
  return { data, error };
}
