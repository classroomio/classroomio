/** The question's page on the org's web dashboard: `/lms` for learners, `/org/<site>` for staff, as the web routes them. */
export function questionWebUrlOf(host: string, siteName: string, slug: string, isStaff: boolean) {
  const base = isStaff ? `/org/${siteName}` : '/lms';

  return `https://${host}${base}/community/${encodeURIComponent(slug)}`;
}
