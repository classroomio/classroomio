export interface LinkedInCertificationParams {
  courseTitle: string;
  orgName: string;
  earnedAt?: string | Date | null;
  certificateId?: string | null;
  verificationUrl?: string | null;
}

/**
 * Builds the official LinkedIn deep link to pre-fill the "Add license or certification" dialog.
 * https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=...&organizationName=...
 */
export function buildLinkedInCertificationUrl(params: LinkedInCertificationParams): string {
  const rawDate = params.earnedAt ? new Date(params.earnedAt) : new Date();
  const validDate = !Number.isNaN(rawDate.getTime()) ? rawDate : new Date();

  const issueYear = validDate.getFullYear();
  // LinkedIn expects 1-indexed months (1 = January, 12 = December)
  const issueMonth = validDate.getMonth() + 1;

  const searchParams = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: params.courseTitle || 'Course Certificate',
    organizationName: params.orgName || 'ClassroomIO',
    issueYear: String(issueYear),
    issueMonth: String(issueMonth)
  });

  if (params.certificateId) {
    searchParams.set('certId', params.certificateId);
  }

  if (params.verificationUrl) {
    searchParams.set('certUrl', params.verificationUrl);
  }

  return `https://www.linkedin.com/profile/add?${searchParams.toString()}`;
}
