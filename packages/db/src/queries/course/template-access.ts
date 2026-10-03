export function isGlobalCourseTemplate(
  course: { isTemplate: boolean; publicForAll: boolean; status: string },
  courseOrgId: string | null,
  platformOrgId: string | undefined
) {
  if (!platformOrgId) return false;

  return course.isTemplate && course.publicForAll && course.status === 'ACTIVE' && courseOrgId === platformOrgId;
}

/** A course may read a template it is already linked to, including after that template is deleted. */
export function canReadLinkedTemplate(
  course: { isTemplate: boolean; publicForAll: boolean },
  courseOrgId: string | null,
  requesterOrgId: string,
  platformOrgId: string | undefined
) {
  if (!course.isTemplate) return false;
  if (courseOrgId === requesterOrgId) return true;
  if (!platformOrgId) return false;

  return course.publicForAll && courseOrgId === platformOrgId;
}

export function canUseCourseTemplate(
  course: { isTemplate: boolean; publicForAll: boolean; status: string },
  courseOrgId: string | null,
  requesterOrgId: string,
  platformOrgId: string | undefined
) {
  if (!course.isTemplate || course.status !== 'ACTIVE') return false;
  if (courseOrgId === requesterOrgId) return true;

  return isGlobalCourseTemplate(course, courseOrgId, platformOrgId);
}
