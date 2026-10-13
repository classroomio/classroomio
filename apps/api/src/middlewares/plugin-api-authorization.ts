import type { MiddlewareHandler } from 'hono';
import type { AuthSession } from '@api/types/auth';
import type { PluginResourceBinding } from '@api/services/plugin/authorization';
import { handlePluginApiError } from '@api/routes/plugin-api/errors';
import { AppError } from '@api/utils/errors';
import type { PluginPermissionScope } from '@cio/utils/validation/plugin';

interface PluginApiRoutePolicy {
  scope: PluginPermissionScope;
  requestedResource?: PluginResourceBinding;
  requireBoundResource?: boolean;
  allowedContributionTargets?: readonly string[];
  allowedRoles?: readonly ('admin' | 'tutor' | 'student')[];
}

function routePolicy(method: string, pathname: string): PluginApiRoutePolicy | null {
  const path = pathname.replace(/^\/plugin-api/, '').replace(/^\/v1/, '') || '/';
  if (method === 'GET' && path === '/identity/profile') {
    return { scope: 'identity.profile:read' };
  }
  if (method === 'GET' && path === '/organization/profile') {
    return { scope: 'organization.profile:read' };
  }
  if (method === 'GET' && (path === '/courses' || /^\/courses\/[^/]+$/.test(path))) {
    return { scope: 'course.metadata:read' };
  }
  if (method === 'GET' && /^\/courses\/[^/]+\/structure$/.test(path)) {
    return { scope: 'course.content:read' };
  }
  if (method === 'GET' && (path === '/lessons' || /^\/lessons\/[^/]+$/.test(path))) {
    return { scope: 'lesson.metadata:read' };
  }
  if (method === 'GET' && /^\/lessons\/[^/]+\/content$/.test(path)) {
    return { scope: 'lesson.content:read' };
  }
  if (method === 'GET' && /^\/courses\/[^/]+\/lessons$/.test(path)) {
    return { scope: 'lesson.metadata:read' };
  }
  if (method === 'GET' && /^\/courses\/[^/]+\/progress$/.test(path)) {
    const courseId = decodeURIComponent(path.split('/')[2]);
    return {
      scope: 'learner.progress:read',
      requestedResource: { type: 'course', id: courseId },
      requireBoundResource: true
    };
  }
  if (/^\/lessons\/[^/]+\/progress$/.test(path)) {
    const lessonId = decodeURIComponent(path.split('/')[2]);
    return {
      scope: method === 'GET' ? 'learner.progress:read' : 'learner.progress:write',
      requestedResource: { type: 'lesson', id: lessonId },
      requireBoundResource: true
    };
  }
  if (/^\/courses\/[^/]+\/certificate-template$/.test(path)) {
    const courseId = decodeURIComponent(path.split('/')[2]);
    return {
      scope: method === 'GET' ? 'certificate.template:read' : 'certificate.template:write',
      requestedResource: { type: 'course', id: courseId },
      requireBoundResource: true,
      allowedContributionTargets: ['certificate.templates'],
      allowedRoles: ['admin', 'tutor']
    };
  }
  if (method === 'GET' && /^\/courses\/[^/]+\/enrollments(\/[^/]+)?$/.test(path)) {
    return { scope: 'course.enrollment:read' };
  }
  if (method === 'GET' && (/^\/courses\/[^/]+\/exercises$/.test(path) || /^\/exercises\/[^/]+$/.test(path))) {
    return { scope: 'exercise.metadata:read' };
  }
  if (method === 'GET' && /^\/certificates\/issued(\/[^/]+)?$/.test(path)) {
    return { scope: 'certificate.issued:read' };
  }
  if (method === 'GET' && path === '/certificates/templates') {
    return { scope: 'certificate.template:read' };
  }
  if (path.startsWith('/storage/')) {
    return { scope: method === 'GET' ? 'plugin.storage:read' : 'plugin.storage:write' };
  }

  return null;
}

export const pluginApiAuthorizationMiddleware: MiddlewareHandler<AuthSession> = async (c, next) => {
  const claims = c.get('pluginApiClaims');
  const policy = routePolicy(c.req.method, c.req.path);
  if (!claims || !policy) {
    await next();

    return;
  }

  try {
    if (!claims.scopes.includes(policy.scope)) {
      throw new AppError(`Access token lacks ${policy.scope}`, 'PLUGIN_PERMISSION_DENIED', 403);
    }
    if (policy.allowedRoles && !policy.allowedRoles.includes(claims.organizationRole)) {
      throw new AppError('Plugin actor does not have the required organization role', 'FORBIDDEN', 403);
    }
    if (policy.allowedContributionTargets && !policy.allowedContributionTargets.includes(claims.contributionTarget)) {
      throw new AppError('Operation is unavailable in this contribution surface', 'FORBIDDEN', 403);
    }
    if (policy.requireBoundResource && !claims.resource) {
      throw new AppError('Operation requires a host-bound resource', 'FORBIDDEN', 403);
    }
    if (
      policy.requestedResource &&
      (!claims.resource ||
        claims.resource.type !== policy.requestedResource.type ||
        claims.resource.id !== policy.requestedResource.id)
    ) {
      throw new AppError('Requested resource does not match the host-bound resource', 'FORBIDDEN', 403);
    }

    await next();
  } catch (error) {
    return handlePluginApiError(c, error, 'Plugin API authorization failed');
  }
};
