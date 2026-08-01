import { AppError, ErrorCodes } from '@api/utils/errors';
import { ensurePublicSlugsForSubtree, getPublicDocPageByOrgSiteAndSlug } from '@cio/db/queries/docs/public-doc';

export async function getPublicDocService(siteName: string, docSlug: string) {
  try {
    return await getPublicDocPageByOrgSiteAndSlug(siteName, docSlug);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to load public note', ErrorCodes.INTERNAL_ERROR, 500);
  }
}
