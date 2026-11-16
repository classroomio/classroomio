import { error } from '@sveltejs/kit';

import { classroomio } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { PublicStudentReportSuccess } from '$features/student-report/utils';

export const load = async ({ params, getClientAddress, setHeaders }) => {
  setHeaders({
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer'
  });

  const result = await safeServerApi<PublicStudentReportSuccess>(() =>
    classroomio['student-report'][':token'].$get(
      { param: { token: params.token } },
      { headers: { 'x-forwarded-for': getClientAddress() } }
    )
  );

  if (!result.ok) throw error(result.status === 429 ? 429 : 404, 'Not found');

  return { report: result.body.data };
};
