import { getAllTemplatesMetadata, getTemplatesById } from '@api/utils/mocks';
import { ExerciseTemplate } from '@api/utils/mocks/utils';

export function handleGetAllTemplatesMetadata() {
  return getAllTemplatesMetadata();
}

export async function handleGetTemplateById(id: string): Promise<ExerciseTemplate[]> {
  return getTemplatesById(id);
}
