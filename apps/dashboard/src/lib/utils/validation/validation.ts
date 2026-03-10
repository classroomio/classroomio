import * as z from 'zod';

import type { ZodError } from 'zod';
import { t } from '$lib/utils/functions/translations';

/**
 * Maps Zod validation errors to translated messages using convention-based keys.
 *
 * Convention:
 * - With entity: validations.{entityName}.{fieldName}.{errorCode}
 * - Without entity: validations.{fieldName}.{errorCode}
 *
 * Examples:
 * - Entity: "course", Field: "title", Error: "too_small"
 *   → First tries: "validations.course.title.too_small"
 *   → Falls back to: "validations.title.too_small"
 *
 * - Field: "email", Error: "invalid_string"
 *   → Translation key: "validations.email.invalid_string"
 *
 * This allows entity-specific error messages like "Course title is required"
 * vs "Lesson title is required" while still supporting generic messages.
 *
 * @param error - Zod validation error object
 * @param entityName - Optional entity prefix (e.g., 'course', 'lesson')
 * @returns Object mapping field paths to translated error messages
 */
export function mapZodErrorsToTranslations(error: ZodError, entityName?: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!error?.issues) {
    return errors;
  }

  console.log('mapZodErrorsToTranslations error', error, error.issues);

  error.issues.forEach((issue: z.core.$ZodIssue) => {
    const fieldPath = issue.path.join('.');
    const fieldName = issue.path[issue.path.length - 1] as string;

    if (!fieldName) return;

    const translationKeys = buildTranslationKeys(fieldName, issue, entityName);
    const translationParams = buildTranslationParams(issue, fieldName, entityName);

    let translatedMessage: string | null = null;
    for (const key of translationKeys) {
      if (key === 'validations.generic.custom') {
        translatedMessage = t.get(issue.message);
        break;
      }

      if (issue.code === 'invalid_type' && translationParams.received === 'undefined') {
        translatedMessage = t.get('validations.generic.required_field');
        break;
      }

      try {
        const translation = t.get(key, translationParams);
        if (translation && translation !== key) {
          translatedMessage = translation;
          break;
        }
      } catch (_error) {
        console.log('t.get validation error', _error);
        translatedMessage = issue.message;
        break;
      }
    }

    errors[fieldPath] = translatedMessage || issue.message;
  });

  return errors;
}

function buildTranslationKeys(fieldName: string, issue: z.core.$ZodIssue, entityName?: string): string[] {
  const keys: string[] = [];

  const errorSuffix = issue.code;

  if (entityName) {
    // 1. Try entity-specific key first: validations.course.title.too_small
    keys.push(`validations.${entityName}.${fieldName}.${errorSuffix}`);
  }

  // 2. Try generic field key: validations.title.too_small
  keys.push(`validations.${fieldName}.${errorSuffix}`);

  // 3. Try generic translation based on error type
  keys.push(`validations.generic.${errorSuffix}`);

  return keys;
}

function buildTranslationParams(
  issue: z.core.$ZodIssue,
  fieldName: string,
  entityName?: string
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  console.log('buildTranslationParams issue', issue);
  console.log('buildTranslationParams fieldName', fieldName);
  console.log('buildTranslationParams entityName', entityName);

  if (fieldName) params.field = fieldName;
  if (entityName) params.entity = entityName;
  if (issue.code) params.code = issue.code;
  if (issue.message) params.message = issue.message;

  const details = issue as unknown as Record<string, unknown>;

  switch (issue.code) {
    case 'invalid_type':
      if ('expected' in details) params.expected = details.expected;
      if ('received' in details) params.received = details.received;
      if ('format' in details) params.format = details.format;
      if (!details.received && !params.format) params.received = 'undefined';
      break;
    case 'too_small':
      if ('minimum' in details) params.minimum = details.minimum;
      if ('inclusive' in details) params.inclusive = details.inclusive;
      if ('type' in details) params.type = details.type;
      if ('exact' in details) params.exact = details.exact;
      break;
    case 'too_big':
      if ('maximum' in details) params.maximum = details.maximum;
      if ('inclusive' in details) params.inclusive = details.inclusive;
      if ('type' in details) params.type = details.type;
      if ('exact' in details) params.exact = details.exact;
      break;
    case 'invalid_format':
      if ('format' in details) params.validation = details.format;
      if ('regex' in details) params.regex = details.regex;
      break;
    case 'not_multiple_of':
      if ('multipleOf' in details) params.multipleOf = details.multipleOf;
      break;
    case 'unrecognized_keys':
      if ('keys' in details) {
        params.keys = Array.isArray(details.keys) ? (details.keys as unknown[]).join(', ') : details.keys;
      }
      break;
    case 'invalid_union':
      if ('unionErrors' in details) {
        params.unionErrors = Array.isArray(details.unionErrors)
          ? (details.unionErrors as unknown[]).length
          : details.unionErrors;
      }
      break;
    case 'invalid_key':
      if ('key' in details) params.key = details.key;
      break;
    case 'invalid_element':
      if ('index' in details) params.index = details.index;
      if ('element' in details) params.element = details.element;
      break;
    case 'invalid_value':
      if ('expected' in details) params.expected = details.expected;
      if ('received' in details) params.received = details.received;
      break;
    case 'custom':
      if ('params' in details) {
        params.params =
          typeof details.params === 'object' && details.params !== null
            ? JSON.stringify(details.params)
            : details.params;
      }
      break;
    default:
      break;
  }

  return params;
}

/**
 * Helper to check if a Zod validation passed
 */
export function isValidationError(result: {
  success: boolean;
  error?: ZodError;
}): result is { success: false; error: ZodError } {
  return Boolean(result && result.success === false && result.error);
}

/**
 * Validates data and returns either errors or valid data
 *
 * @example
 * // Without entity prefix
 * const result = validateWithTranslation(ZUserSchema, formData);
 *
 * // With entity prefix for entity-specific error messages
 * const result = validateWithTranslation(ZCourseSchema, formData, 'course');
 *
 * if (result.errors) {
 *   // Show errors to user
 *   setErrors(result.errors);
 * } else {
 *   // Use validated data
 *   await saveUser(result.data);
 * }
 */
export function validateWithTranslation<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; error?: ZodError; data?: T } },
  data: unknown,
  entityName?: string
): { errors: Record<string, string> } | { data: T } {
  const result = schema.safeParse(data);

  if (!result.success && result.error) {
    return { errors: mapZodErrorsToTranslations(result.error, entityName) };
  }

  return { data: result.data as T };
}
