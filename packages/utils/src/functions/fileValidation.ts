/**
 * Server-side file type validation utilities for preventing malicious uploads
 * Specifically designed to prevent SVG XSS attacks and other security issues
 */
import { ALLOWED_IMAGE_TYPES } from '../validation/constants';

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

/**
 * Validate file type by MIME type
 * @param file - File object to validate
 * @returns boolean indicating if file type is allowed
 */
export function validateImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]);
}

/**
 * Validate file extension
 * @param filename - Filename to validate
 * @returns boolean indicating if extension is allowed
 */
export function validateImageExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number]);
}

/**
 * Comprehensive file validation
 * @param file - File object to validate
 * @returns object with validation result and error message
 */
export function validateImageUpload(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!validateImageType(file)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'
    };
  }

  // Check file extension (double check for security)
  if (!validateImageExtension(file.name)) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp files are allowed.'
    };
  }

  // Additional security checks
  if (file.name.toLowerCase().includes('.svg')) {
    return {
      isValid: false,
      error: 'SVG files are not allowed for security reasons.'
    };
  }

  return { isValid: true };
}

/**
 * Sanitize filename to prevent directory traversal and other issues
 * @param filename - Original filename
 * @returns sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[/\\]/g, '');

  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}
