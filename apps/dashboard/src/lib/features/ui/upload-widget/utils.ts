import { classroomio } from '$lib/utils/services/api';

export async function queryUnsplash(searchQuery: string) {
  try {
    const response = await classroomio.unsplash.$post({
      json: { searchQuery }
    });

    const result = await response.json();

    if (result.success && result.photos) {
      return result.photos;
    }

    const error = 'error' in result ? result.error : 'Failed to fetch photos from Unsplash';

    throw new Error(error);
  } catch (error) {
    console.error('Error sending fetch request', error);
    throw error;
  }
}
