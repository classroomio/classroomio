import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { calcCourseDiscount } from '$lib/utils/functions/course';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params, url }) => {
  const slug = params?.slug ?? '';
  const inviteToken = url.searchParams.get('invite_token') ?? null;

  if (!slug) {
    redirect(307, '/404');
  }

  if (inviteToken) {
    try {
      const response = await classroomio.invite.student[':token'].$get(
        { param: { token: inviteToken } },
        getApiKeyHeaders()
      );
      const result = await response.json();

      if (!result.success || !result.data) {
        redirect(307, '/404');
      }

      const data = result.data;
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
        requiresPaymentOrInvite: false,
        token: inviteToken
      };
    } catch (error) {
      console.error('Enroll load: failed to load invite', error);
      redirect(307, '/404');
    }
  }

  try {
    const response = await classroomio.course.slug[':slug'].$get({
      param: { slug }
    });
    const result = await response.json();

    if (!result.success || !result.data) {
      redirect(307, '/404');
    }

    const courseData = result.data;
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
  } catch (error) {
    console.error('Enroll load: failed to load course by slug', error);
    redirect(307, '/404');
  }
};
