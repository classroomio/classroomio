import { markInternalRequest } from './internal-request';

type InternalDispatch = (request: Request, env: unknown) => Response | Promise<Response>;

let dispatch: InternalDispatch | null = null;

export function setInternalDispatch(handler: InternalDispatch): void {
  dispatch = handler;
}

/**
 * Runs a request through the full application stack without a network hop and marks it as internal.
 * Throws until the application has registered itself with `setInternalDispatch`.
 */
export function dispatchInternalRequest(request: Request, env: unknown): Response | Promise<Response> {
  if (!dispatch) {
    throw new Error('Internal dispatch is not ready');
  }

  const headers = new Headers(request.headers);
  markInternalRequest(headers);

  return dispatch(new Request(request, { headers }), env);
}
