import { snackbar } from '$lib/components/Snackbar/store';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Generic error handler for Supabase queries
 * @param error - The error object from Supabase
 * @param operation - Description of the operation that failed (e.g., 'create role', 'fetch permissions')
 * @param customMessage - Optional custom error message to show to user
 * @returns boolean - true if there was an error, false if no error
 */
export function handleSupabaseError(
  error: PostgrestError | null,
  operation: string,
  customMessage?: string | ((error: PostgrestError) => void)
): boolean {
  if (error) {
    console.error(`Failed to ${operation}`, error);

    if (typeof customMessage === 'function') {
      customMessage(error);
    } else {
      snackbar.error(customMessage || `Failed to ${operation}`);
    }
    return true;
  }
  return false;
}

/**
 * Wrapper function that executes a Supabase query and handles errors
 * @param queryFn - Function that returns a Supabase query builder
 * @param operation - Description of the operation (e.g., 'create role', 'fetch permissions')
 * @param customMessage - Optional custom error message
 * @returns Promise<T | null> - Returns the data if successful, null if error
 */
export async function executeSupabaseQuery<T>(
  queryFn: () => any,
  operation: string,
  customMessage?: string | ((error: PostgrestError) => void)
): Promise<T | null> {
  const { data, error } = await queryFn();

  if (handleSupabaseError(error, operation, customMessage)) {
    return null;
  }

  return data as T;
}

/**
 * Handles multiple Supabase queries and checks for any errors
 * @param results - Array of Supabase query results
 * @param operation - Description of the batch operation
 * @param customMessage - Optional custom error message
 * @returns boolean - true if any query had an error
 */
export function handleBatchSupabaseErrors(
  results: Array<{ error: PostgrestError | null }>,
  operation: string,
  customMessage?: string
): boolean {
  const hasError = results.some((result) => result.error);

  if (hasError) {
    const errors = results.map((result) => result.error).filter(Boolean);
    console.error(`Failed to ${operation}`, errors);
    snackbar.error(customMessage || `Failed to ${operation}`);
    return true;
  }

  return false;
}
