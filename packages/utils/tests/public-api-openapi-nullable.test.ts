import { describe, expect, it } from 'vitest';

import { enrichPublicApiOpenApiSpec } from '../src/openapi/public-api';

const specWithSchema = (schema: Record<string, unknown>) => ({
  openapi: '3.1.0',
  paths: {
    '/public-api/v1/things': {
      get: { responses: { 200: { content: { 'application/json': { schema } } } } }
    }
  }
});

const schemaOf = (spec: ReturnType<typeof specWithSchema>) =>
  spec.paths['/public-api/v1/things'].get.responses[200].content['application/json'].schema;

describe('nullable fields in the public API spec', () => {
  it('turns a value-or-null union into one nullable type', () => {
    const spec = enrichPublicApiOpenApiSpec(
      specWithSchema({
        type: 'object',
        properties: {
          sectionId: {
            description: 'The section',
            anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }]
          }
        }
      })
    );

    expect(schemaOf(spec)).toEqual({
      type: 'object',
      properties: { sectionId: { description: 'The section', type: ['string', 'null'], format: 'uuid' } }
    });
  });

  it('keeps null allowed for a nullable enum', () => {
    const spec = enrichPublicApiOpenApiSpec(
      specWithSchema({ anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'null' }] })
    );

    expect(schemaOf(spec)).toEqual({ type: ['string', 'null'], enum: ['a', 'b', null] });
  });

  it('turns a union of single values into one list of allowed values', () => {
    const roles = {
      anyOf: [
        { type: 'number', const: 1 },
        { type: 'number', const: 2 }
      ]
    };
    const nullableRoles = { anyOf: [roles, { type: 'null' }] };

    expect(schemaOf(enrichPublicApiOpenApiSpec(specWithSchema(roles)))).toEqual({ type: 'number', enum: [1, 2] });
    expect(schemaOf(enrichPublicApiOpenApiSpec(specWithSchema(nullableRoles)))).toEqual({
      type: ['number', 'null'],
      enum: [1, 2, null]
    });
  });

  it('leaves other unions alone', () => {
    const union = { anyOf: [{ type: 'boolean' }, { type: 'string', enum: ['true', 'false'] }] };
    const reference = { anyOf: [{ $ref: '#/components/schemas/Thing' }, { type: 'null' }] };

    expect(schemaOf(enrichPublicApiOpenApiSpec(specWithSchema(union)))).toEqual(union);
    expect(schemaOf(enrichPublicApiOpenApiSpec(specWithSchema(reference)))).toEqual(reference);
  });
});
