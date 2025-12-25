import { classroomio } from './api';

/**
 * Uploads an image file to R2 storage and returns the public URL
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image
 * @throws Error if upload fails
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const response = await classroomio.media.image.$post({
      form: {
        file: file
      }
    });

    const data = await response.json();
    if (!data.success || !data.url) {
      const errorMessage = 'error' in data ? data.error : 'Failed to upload image';
      throw new Error(errorMessage);
    }

    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
