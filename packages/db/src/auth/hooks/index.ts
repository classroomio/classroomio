import { createAuthMiddleware } from 'better-auth/api';
import { createProfileHook } from './create-profile';

export type AuthMiddlewareContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

/**
 * Array of all hooks to run after better-auth requests
 *
 * Add new hooks here to register them
 */
const afterHooks: Array<(context: AuthMiddlewareContext) => Promise<unknown>> = [createProfileHook];

/**
 * Combines all after hooks into a single function
 * This function will be called by better-auth after each request
 */
export const combineAfterHooks = async (context: AuthMiddlewareContext) => {
  for (const hook of afterHooks) {
    try {
      await hook(context);
    } catch (error) {
      console.error('Error executing hook:', error);
    }
  }
};
