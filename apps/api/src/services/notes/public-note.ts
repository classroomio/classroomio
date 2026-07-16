import { AppError, ErrorCodes } from '@api/utils/errors';
import { getPublicNoteByOrgSiteAndSlug, type PublicNoteView } from '@cio/db/queries/notes';

export async function getPublicNoteService(siteName: string, noteSlug: string): Promise<PublicNoteView | null> {
  try {
    return await getPublicNoteByOrgSiteAndSlug(siteName, noteSlug);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to load public note', ErrorCodes.INTERNAL_ERROR, 500);
  }
}
