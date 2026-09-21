import { classroomio } from '$lib/utils/services/api';
import { ApiError } from '$lib/utils/services/api/types';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const acceptHeaders = {
      ...getApiKeyHeaders().headers,
      Accept: 'text/markdown'
    };

    const response = await classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].markdown.$get(
      { param: { courseSlug: params.slug, itemSlug: params.itemSlug } },
      { headers: acceptHeaders }
    );

    if (!response.ok) {
      throw error(response.status === 404 ? 404 : 502, 'Markdown export is not available for this lesson');
    }

    const markdown = await response.text();

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (caught) {
    if (typeof caught === 'object' && caught !== null && 'status' in caught && 'body' in caught) {
      throw caught;
    }

    if (caught instanceof ApiError && caught.status === 404) {
      throw error(404, 'Markdown export is not available for this lesson');
    }

    throw error(502, 'Failed to export lesson markdown');
  }
};
