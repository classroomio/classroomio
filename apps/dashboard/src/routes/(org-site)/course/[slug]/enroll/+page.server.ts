import type { CourseBySlugWithOrg, GetCourseBySlugRequest } from '$features/course/utils/types';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { calcCourseDiscount } from '$lib/utils/functions/course';
import { error } from '@sveltejs/kit';

type GetStudentInvitePreviewRequest = (typeof classroomio.invite.student)[':token']['$get'];
type GetStudentInvitePreviewSuccess = Extract<InferResponseType<GetStudentInvitePreviewRequest>, { success: true }>;
type GetCourseBySlugSuccess = Extract<InferResponseType<GetCourseBySlugRequest>, { success: true }>;

export const load = async ({ params, url }) => {
  const slug = params?.slug ?? '';
  const inviteToken = url.searchParams.get('invite_token') ?? null;

  if (!slug) {
    throw error(404, 'Not found');
  }

  if (inviteToken) {
    const inviteResult = await safeServerApi<GetStudentInvitePreviewSuccess>(() =>
      classroomio.invite.student[':token'].$get({ param: { token: inviteToken } }, getApiKeyHeaders())
    );

    if (!inviteResult.ok || !inviteResult.body.data) {
      console.error('Enroll load: failed to load invite', inviteResult);
      throw error(404, 'Not found');
    }

    const data = inviteResult.body.data;
    const course = {
      id: data.course.id,
      slug: data.course.slug,
      title: data.course.title,
      description: data.course.description,
      cost: data.course.cost ?? 0,
      allowNewStudent: data.course.allowNewStudent ?? true,
      status: data.course.status,
      isPublished: data.course.isPublished
    };
    const currentOrg = {
      id: data.organization.id,
      name: data.organization.name,
      siteName: data.organization.siteName ?? '',
      theme: data.organization.theme ?? undefined
    };

    return {
      course,
      currentOrg,
      invite: data.invite,
      inviteEmail: data.inviteContext?.recipientEmail ?? null,
      inviteEmailExists: data.inviteContext?.recipientExists ?? false,
      requiresPaymentOrInvite: false,
      token: inviteToken
    };
  }

  const courseResult = await safeServerApi<GetCourseBySlugSuccess>(() =>
    classroomio.course.slug[':slug'].$get({
      param: { slug }
    })
  );

  if (!courseResult.ok || !courseResult.body.data) {
    console.error('Enroll load: failed to load course by slug', courseResult);
    throw error(404, 'Not found');
  }

  const courseData = courseResult.body.data as CourseBySlugWithOrg;
  const discount = (courseData.metadata as { discount?: number } | null)?.discount ?? 0;
  const showDiscount = (courseData.metadata as { showDiscount?: boolean } | null)?.showDiscount ?? false;
  const calculatedCost = calcCourseDiscount(discount, Number(courseData.cost ?? 0), showDiscount);
  const isFree = calculatedCost <= 0;

  const currentOrg = courseData.org
    ? {
        id: courseData.org.id,
        name: courseData.org.name,
        siteName: courseData.org.siteName ?? '',
        theme: courseData.org.theme ?? undefined
      }
    : null;

  const course = {
    id: courseData.id,
    slug: courseData.slug,
    title: courseData.title,
    description: courseData.description,
    cost: courseData.cost ?? 0,
    allowNewStudent: (courseData.metadata as { allowNewStudent?: boolean } | null)?.allowNewStudent ?? true,
    status: courseData.status,
    isPublished: courseData.isPublished
  };

  return {
    course,
    currentOrg,
    invite: null,
    requiresPaymentOrInvite: !isFree,
    token: null as string | null
  };
};
