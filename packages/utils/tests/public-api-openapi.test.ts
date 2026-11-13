import { describe, expect, it } from 'vitest';
import {
  enrichPublicApiOpenApiSpec,
  OAUTH_API_SCOPES,
  PUBLIC_API_BEARER_SCHEME,
  PUBLIC_API_OAUTH_SCHEME
} from '../src/openapi/public-api';

describe('enrichPublicApiOpenApiSpec', () => {
  it('adds the oauth2 security scheme alongside bearerAuth with authorization-code flow', () => {
    const spec = enrichPublicApiOpenApiSpec({ paths: {} });
    const components = spec.components as {
      securitySchemes: Record<string, { type: string; flows?: { authorizationCode: Record<string, unknown> } }>;
    };

    expect(PUBLIC_API_OAUTH_SCHEME).toBe('oauth2');
    expect(components.securitySchemes[PUBLIC_API_BEARER_SCHEME]).toBeDefined();
    expect(components.securitySchemes[PUBLIC_API_OAUTH_SCHEME]).toMatchObject({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://app.classroomio.com/api/auth/oauth2/authorize',
          tokenUrl: 'https://app.classroomio.com/api/auth/oauth2/token'
        }
      }
    });

    const flow = components.securitySchemes[PUBLIC_API_OAUTH_SCHEME]?.flows?.authorizationCode;
    const scopes = flow?.scopes as Record<string, string>;

    expect(scopes).toBeDefined();
    for (const scope of OAUTH_API_SCOPES) {
      expect(typeof scopes[scope]).toBe('string');
      expect(scopes[scope].length).toBeGreaterThan(0);
    }
    expect(scopes['public_api:*']).toBeUndefined();
    expect(scopes['course:write']).toBe('Create, clone, edit, publish and unpublish courses and their content');
    expect(spec.security).toEqual([{ [PUBLIC_API_BEARER_SCHEME]: [] }, { [PUBLIC_API_OAUTH_SCHEME]: [] }]);
  });

  it('includes the Connection and Webhook Subscriptions tags', () => {
    const spec = enrichPublicApiOpenApiSpec({ paths: {} });
    const tagNames = (spec.tags as Array<{ name: string }>).map((tag) => tag.name);

    expect(tagNames).toContain('Connection');
    expect(tagNames).toContain('Webhook Subscriptions');
  });

  it('applies operation summaries and both security schemes to new automation and enrollment paths', () => {
    const rawPaths = {
      '/public-api/v1/me': {
        get: { tags: ['Connection'] }
      },
      '/public-api/v1/webhooks/subscriptions': {
        post: { tags: ['Webhook Subscriptions'] }
      },
      '/public-api/v1/webhooks/subscriptions/{subscriptionId}': {
        delete: { tags: ['Webhook Subscriptions'] }
      },
      '/public-api/v1/webhooks/samples': {
        get: { tags: ['Webhook Subscriptions'] }
      },
      '/public-api/v1/courses/{courseId}/enrollments': {
        post: { tags: ['Course Members'] }
      }
    };

    const spec = enrichPublicApiOpenApiSpec({ paths: rawPaths });
    const paths = spec.paths as Record<string, Record<string, { summary?: string; security?: unknown[] }>>;

    expect(paths['/public-api/v1/me']?.get?.summary).toBe('Get the current connection');
    expect(paths['/public-api/v1/webhooks/subscriptions']?.post?.summary).toBe('Create a webhook subscription');
    expect(paths['/public-api/v1/webhooks/subscriptions/{subscriptionId}']?.delete?.summary).toBe(
      'Delete a webhook subscription'
    );
    expect(paths['/public-api/v1/webhooks/samples']?.get?.summary).toBe('List sample events');
    expect(paths['/public-api/v1/courses/{courseId}/enrollments']?.post?.summary).toBe('Enroll a student by email');

    for (const pathItem of Object.values(paths)) {
      for (const operation of Object.values(pathItem)) {
        expect(operation.security).toEqual([{ [PUBLIC_API_BEARER_SCHEME]: [] }, { [PUBLIC_API_OAUTH_SCHEME]: [] }]);
      }
    }
  });

  it('keeps an operation-declared security scheme instead of adding the OAuth alternative', () => {
    const rawPaths = {
      '/public-api/v1/courses': {
        post: { tags: ['Courses'], security: [{ [PUBLIC_API_BEARER_SCHEME]: [] }] }
      }
    };

    const spec = enrichPublicApiOpenApiSpec({ paths: rawPaths });
    const paths = spec.paths as Record<string, Record<string, { security?: unknown[] }>>;

    expect(paths['/public-api/v1/courses']?.post?.security).toEqual([{ [PUBLIC_API_BEARER_SCHEME]: [] }]);
  });
});
