import type { InferResponseType } from '@cio/api/rpc-types';
import type { ZodValidationError, ZodValidatorMesssage } from './types';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import { ZodError } from 'zod/v4';
import { toNormalizedApiError, type NormalizedApiError } from './errors';

// Extract the data type from a success response
type ExtractData<T> = Extract<InferResponseType<T>, { success: true }>;

interface ExecuteOptions<TrpcType> {
  requestFn: () => Promise<Response>;
  errorMessage?: string;
  onSuccess?: (data: ExtractData<TrpcType>) => Promise<void> | void;
  onError?: (error: NormalizedApiError) => Promise<void> | void;
  logContext?: string;
}

/**
 * Base API class that provides shared state management and request handling
 * for all API classes in the application.
 */
export class BaseApi {
  isLoading = $state(false);
  error = $state<string | null>(null);
  success = $state(false);
  lastError = $state<NormalizedApiError | null>(null);

  constructor(loading = false) {
    this.isLoading = loading;
    this.error = null;
  }
  /**
   * Execute an API request with automatic loading and error state management
   * Type is automatically inferred from the RPC call (e.g., classroomio.organization.plan.$post)
   * @param options Configuration for the request
   * @returns The data from the response, or the default return value on error
   */
  protected async execute<TrpcType>(options: ExecuteOptions<TrpcType>): Promise<ExtractData<TrpcType> | undefined> {
    const { requestFn, onSuccess, logContext = 'API request' } = options;

    this.isLoading = true;
    this.error = null;
    this.lastError = null;
    this.success = false;

    try {
      const response = await requestFn();
      const result = (await response.json()) as unknown;

      if (typeof result === 'object' && result !== null && 'success' in result) {
        const apiResult = result as { success: boolean; data?: unknown; error?: string; message?: string };

        if (apiResult.success === false) {
          const normalized = toNormalizedApiError(apiResult, response.status);
          this.error = normalized.message;
          this.lastError = normalized;
          await options.onError?.(normalized);

          return;
        }

        const typedResult = apiResult as ExtractData<TrpcType>;

        this.resetErrors();

        if (onSuccess) {
          await onSuccess(typedResult);
        }

        this.success = true;
        return typedResult;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error(`Error in ${logContext}:`, error);
      const normalized = toNormalizedApiError(error);
      this.error = normalized.message;
      this.lastError = normalized;
      await options.onError?.(normalized);
    } finally {
      this.isLoading = false;
    }
  }

  resetErrors() {
    this.error = null;
    this.lastError = null;
  }

  /**
   * Reset the API state
   */
  reset() {
    this.isLoading = false;
    this.error = null;
    this.lastError = null;
  }
}

/**
 * Extended base API class that supports errors object (Record<string, string>)
 * for form validation scenarios
 */
export class BaseApiWithErrors extends BaseApi {
  errors = $state<Record<string, string>>({});

  handleValidationError(result: NormalizedApiError): Promise<void> | void {
    const candidates = [result.raw];
    if (typeof result.raw === 'object' && result.raw !== null && 'error' in result.raw) {
      candidates.push((result.raw as { error: unknown }).error);
    }

    for (const candidate of candidates) {
      const zodValidationError = candidate as ZodValidationError | null;

      if (zodValidationError && typeof zodValidationError === 'object' && zodValidationError.name === 'ZodError') {
        try {
          const issues = JSON.parse(zodValidationError.message) as ZodValidatorMesssage;
          this.errors = mapZodErrorsToTranslations(new ZodError(issues));
          return;
        } catch {
          break;
        }
      }
    }

    this.errors = { ...this.errors, general: result.message };
  }

  override resetErrors() {
    this.errors = {};
    this.lastError = null;
  }

  clearError(field: string) {
    if (!(field in this.errors)) return;

    delete this.errors[field];
  }

  /**
   * Reset the API state including errors and success
   */
  override reset() {
    super.reset();
    this.errors = {};
    this.success = false;
  }
}
