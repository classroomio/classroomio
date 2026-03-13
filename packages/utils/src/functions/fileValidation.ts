import { ALLOWED_IMAGE_TYPES } from '../validation/constants';

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

type FileLike = {
  type: string;
  name: string;
};

export function validateImageType(file: FileLike): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]);
}

export function validateImageExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number]);
}

export function validateImageUpload(file: FileLike): { isValid: boolean; error?: string } {
  if (!validateImageType(file)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'
    };
  }

  if (!validateImageExtension(file.name)) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp files are allowed.'
    };
  }

  if (file.name.toLowerCase().includes('.svg')) {
    return {
      isValid: false,
      error: 'SVG files are not allowed for security reasons.'
    };
  }

  return { isValid: true };
}

export function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/[\/\\]/g, '');
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  if (sanitized.length > 255) {
    const extIndex = sanitized.lastIndexOf('.');
    const ext = extIndex !== -1 ? sanitized.substring(extIndex) : '';
    const name = extIndex !== -1 ? sanitized.substring(0, extIndex) : sanitized;
    sanitized = `${name.substring(0, 255 - ext.length)}${ext}`;
  }

  return sanitized;
}
