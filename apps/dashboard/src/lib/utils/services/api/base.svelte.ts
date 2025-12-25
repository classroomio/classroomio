import { getErrMsg } from './utils';
import type { InferResponseType } from '@cio/api/rpc-types';
import { ApiError, type ZodValidationError, type ZodValidatorMesssage } from './types';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import { ZodError } from 'zod/v4';

// Extract the data type from a success response
type ExtractData<T> = Extract<InferResponseType<T>, { success: true }>;
type ExtractError<T> = Extract<InferResponseType<T>, { success: false }>;

interface ExecuteOptions<TrpcType> {
  requestFn: () => Promise<Response>;
  errorMessage?: string;
  onSuccess?: (data: ExtractData<TrpcType>) => Promise<void> | void;
  onError?: (error: ExtractError<TrpcType> | string) => Promise<void> | void;
  logContext?: string;
}

/**
 * Base API class that provides shared state management and request handling
 * for all API classes in the application.
 */
export class BaseApi {
  isLoading = $state(false);
  error = $state<string | null>(null);

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

    try {
      const response = await requestFn();
      const result = (await response.json()) as unknown;

      if (typeof result === 'object' && result !== null && 'success' in result) {
        const apiResult = result as { success: boolean; data?: unknown; error?: string; message?: string };

        if (apiResult.success === false) {
          console.log('apiResult false', apiResult);
          options.onError?.(apiResult as ExtractError<TrpcType>);

          return;
        }

        const typedResult = apiResult as ExtractData<TrpcType>;

        this.resetErrors();

        if (onSuccess) {
          await onSuccess(typedResult);
        }

        return typedResult;
      }
    } catch (error) {
      console.error(`Error in ${logContext}:`, error);
      this.error = getErrMsg(error, `Error ${logContext}:`);

      const errorResult = this.getServerError<ExtractError<TrpcType>>(error);
      options.onError?.(errorResult);
    } finally {
      this.isLoading = false;
    }
  }

  getServerError<T>(error: unknown): T | string {
    if (error instanceof ApiError) {
      console.log('instance of ApiError', error);
      try {
        const json = JSON.parse(error.message) as T;
        return json;
      } catch (e) {
        console.log('error parsing json', e);
        return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return `${error}`;
  }

  resetErrors() {
    this.error = null;
  }

  /**
   * Reset the API state
   */
  reset() {
    this.isLoading = false;
    this.error = null;
  }
}

/**
 * Extended base API class that supports errors object (Record<string, string>)
 * for form validation scenarios
 */
export class BaseApiWithErrors extends BaseApi {
  errors = $state<Record<string, string>>({});
  success = $state(false);

  handleValidationError(result: { success: false; error: string; code: string; field?: string }): Promise<void> | void {
    const zodValidationError = result.error as unknown as ZodValidationError;
    if (zodValidationError.name === 'ZodError') {
      const issues = JSON.parse(zodValidationError.message) as ZodValidatorMesssage;

      this.errors = mapZodErrorsToTranslations(new ZodError(issues));

      return;
    }
  }

  override resetErrors() {
    this.errors = {};
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
