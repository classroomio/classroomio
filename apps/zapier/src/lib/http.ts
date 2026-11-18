import type { Bundle, HttpRequestOptions, HttpResponse, ZObject } from 'zapier-platform-core';

import { isOAuthDataChangeScope } from '@cio/utils/constants/oauth-scopes';
import { isAutomationPlanGateMessage } from '@cio/utils/plans';

import packageJson from '../../package.json' with { type: 'json' };
import { publicApiResource } from './config';

const USER_AGENT = `ClassroomIO-Zapier/${packageJson.version}`;
const PLAN_REQUIRED_MESSAGE =
  "This ClassroomIO organization's plan doesn't include Zapier. Upgrade to Early Adopter or Enterprise to resume your Zaps.";
const READ_ONLY_CONNECTION_MESSAGE =
  'This ClassroomIO connection is read-only, so it cannot make changes. Reconnect ClassroomIO and leave "Allow Zapier to make changes" on to use this action.';
const DEFAULT_RETRY_AFTER_SECONDS = 60;

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  field?: string;
  retryAfter?: number;
  requiredScope?: string | null;
};

export type HttpRequestOptionsWithUrl = HttpRequestOptions & { url: string };

/**
 * True only for requests to the ClassroomIO public API, the one place the stored access token is
 * valid. Token and refresh grants must go out without it: forwarding an expired bearer makes the
 * identity provider reject the refresh and the connection dies.
 */
export function isPublicApiRequest(url: string): boolean {
  try {
    const requestUrl = new URL(url);
    const resourceUrl = new URL(publicApiResource());
    const isSameOrigin = requestUrl.origin === resourceUrl.origin;
    const isPublicApiPath =
      requestUrl.pathname === resourceUrl.pathname || requestUrl.pathname.startsWith(`${resourceUrl.pathname}/`);

    return isSameOrigin && isPublicApiPath;
  } catch {
    return false;
  }
}

export function addRequestHeaders(request: HttpRequestOptionsWithUrl, _z: ZObject, bundle: Bundle) {
  request.headers = {
    ...request.headers,
    Accept: 'application/json',
    'User-Agent': USER_AGENT
  };

  if (bundle.authData.access_token && isPublicApiRequest(request.url)) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }

  return request;
}

function readErrorBody(response: HttpResponse): ApiErrorBody {
  try {
    return (response.data ?? {}) as ApiErrorBody;
  } catch {
    return {};
  }
}

function readRetryAfterSeconds(response: HttpResponse, body: ApiErrorBody): number {
  const header = Number(response.getHeader('retry-after'));

  if (Number.isFinite(header) && header > 0) return header;

  return body.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS;
}

function handleApiErrorsWith(response: HttpResponse, z: ZObject, force: boolean) {
  if (response.status < 400) return response;
  if (!force && response.skipThrowForStatus) return response;

  const body = readErrorBody(response);
  const message = body.error ?? body.message ?? `ClassroomIO responded with HTTP ${response.status}`;

  if (response.status === 401) {
    throw new z.errors.RefreshAuthError(message);
  }

  if (response.status === 403 && body.code === 'UPGRADE_REQUIRED') {
    const planMessage = isAutomationPlanGateMessage(body.error ?? body.message) ? PLAN_REQUIRED_MESSAGE : message;

    throw new z.errors.Error(planMessage, 'PlanRequired', 403);
  }

  if (
    response.status === 403 &&
    body.code === 'INSUFFICIENT_SCOPE' &&
    isOAuthDataChangeScope(body.requiredScope ?? '')
  ) {
    throw new z.errors.Error(READ_ONLY_CONNECTION_MESSAGE, 'ReadOnlyConnection', 403);
  }

  if (response.status === 429) {
    throw new z.errors.ThrottledError(message, readRetryAfterSeconds(response, body));
  }

  if (response.status === 400 && body.field) {
    throw new z.errors.Error(`${body.field}: ${message}`, body.code ?? 'InvalidInput', 400);
  }

  throw new z.errors.Error(message, body.code ?? `Http${response.status}`, response.status);
}

export function handleApiErrors(response: HttpResponse, z: ZObject) {
  return handleApiErrorsWith(response, z, false);
}

/** For flows that set `skipThrowForStatus` to inspect the status themselves. */
export function throwApiErrors(response: HttpResponse, z: ZObject) {
  return handleApiErrorsWith(response, z, true);
}
