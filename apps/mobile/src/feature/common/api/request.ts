import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';

type JsonResponse = { ok: boolean; status: number; json(): Promise<unknown> };

type BodyOf<Response> = Response extends { json(): Promise<infer Body> } ? Body : never;

export type SuccessBody<Response> = Extract<BodyOf<Response>, { success: true }>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Awaits a typed API call and returns its success body; throws ApiError for HTTP errors and `success: false` bodies. */
export async function request<Response extends JsonResponse>(
  pending: Promise<Response>
): Promise<SuccessBody<Response>> {
  const response = await pending;
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || (isRecord(body) && body.success === false)) {
    const message =
      isRecord(body) && typeof body.error === 'string'
        ? body.error
        : createTranslator(commonCatalog, getCurrentLocale())('requestFailed', { status: response.status });
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body as SuccessBody<Response>;
}
