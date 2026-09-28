import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetPathDetailRequest = (typeof classroomio)['learning-path'][':pathId']['$get'];
type GetPathDetailSuccess = Extract<InferResponseType<GetPathDetailRequest>, { success: true }>;

export const load = async ({ params, cookies }) => {
  const publicId = params.publicId;

  if (!publicId) {
    return {
      publicId: '',
      path: null
    };
  }

  const result = await safeServerApi<GetPathDetailSuccess>(() =>
    classroomio['learning-path'][':pathId'].$get({ param: { pathId: publicId } }, getApiHeaders(cookies))
  );

  return {
    publicId,
    path: result.ok ? result.body.data : null
  };
};
