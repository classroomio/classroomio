type InternalDispatch = (request: Request, env: unknown) => Response | Promise<Response>;

let dispatch: InternalDispatch | null = null;

export function setInternalDispatch(handler: InternalDispatch): void {
  dispatch = handler;
}

/**
 * Runs a request through the full application stack without a network hop.
 * Throws until the application has registered itself with `setInternalDispatch`.
 */
export function dispatchInternalRequest(request: Request, env: unknown): Response | Promise<Response> {
  if (!dispatch) {
    throw new Error('Internal dispatch is not ready');
  }

  return dispatch(request, env);
}
