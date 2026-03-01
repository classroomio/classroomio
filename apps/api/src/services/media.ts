import { AppError, ErrorCodes } from '@api/utils/errors';
import { MAX_IMAGE_SIZE } from '@api/constants/upload';

import { ALLOWED_IMAGE_TYPES } from '@cio/utils/validation';
import { getStorageConfig } from '@api/config/storage';
import { generateFileKey } from '@api/utils/upload';
import { uploadToS3 } from '@api/utils/s3';

/**
 * Uploads an image file to object storage and returns the public URL
 * @param file - The image file to upload
 * @returns Object containing the public URL and file key
 */
export async function uploadImage(file: File) {
  const config = getStorageConfig();
  if (!config.mediaPublicBaseUrl) {
    throw new AppError(
      new Error(
        'Media public URL not configured. Set OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL or CLOUDFLARE_IMAGE_BUCKET_DOMAIN.'
      ),
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    throw new AppError(
      new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`),
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new AppError(
      new Error(`File size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`),
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  // Generate unique file key
  const fileKey = generateFileKey(file.name);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to object storage
  const uploadResult = await uploadToS3({
    Bucket: config.bucketMedia,
    Key: fileKey,
    Body: buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000' // Cache for 1 year
  });

  if (!uploadResult.success) {
    throw new AppError(new Error(uploadResult.error || 'Failed to upload image'), ErrorCodes.INTERNAL_ERROR, 500);
  }

  // Construct public URL
  const baseUrl = config.mediaPublicBaseUrl.replace(/\/$/, '');
  const publicUrl = `${baseUrl}/${fileKey}`;

  return {
    url: publicUrl,
    fileKey
  };
}
