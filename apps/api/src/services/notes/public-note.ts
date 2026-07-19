import { AppError, ErrorCodes } from '@api/utils/errors';
import { ensurePublicSlugsForSubtree, getPublicNotePageByOrgSiteAndSlug } from '@cio/db/queries/notes/public-note';

export async function getPublicNoteService(siteName: string, noteSlug: string) {
  try {
    return await getPublicNotePageByOrgSiteAndSlug(siteName, noteSlug);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to load public note', ErrorCodes.INTERNAL_ERROR, 500);
  }
}
