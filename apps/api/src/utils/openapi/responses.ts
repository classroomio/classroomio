import * as z from 'zod';

const PaginationSchema = {
  type: 'object' as const,
  properties: {
    page: { type: 'number' as const },
    limit: { type: 'number' as const },
    total: { type: 'number' as const },
    totalPages: { type: 'number' as const }
  },
  required: ['page', 'limit', 'total', 'totalPages']
};

const toResponseJsonSchema = (schema: z.ZodType) => {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' });
  return jsonSchema;
};

// Extra top-level envelope fields that sit next to `data` (e.g. the echoed `query`).
const envelopeExtras = (extra?: z.ZodObject) => {
  if (!extra) return { properties: {}, required: [] as string[] };

  const { properties = {}, required = [] } = toResponseJsonSchema(extra) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };
  return { properties, required };
};

export const itemResponse = (schema: z.ZodType, extra?: z.ZodObject) => {
  const extras = envelopeExtras(extra);

  return {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean' as const },
      data: toResponseJsonSchema(schema),
      ...extras.properties
    },
    required: ['success', 'data', ...extras.required]
  };
};

export const itemWithMetaResponse = (schema: z.ZodType, meta: z.ZodType) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: toResponseJsonSchema(schema),
    meta: toResponseJsonSchema(meta)
  },
  required: ['success', 'data', 'meta']
});

export const nullableItemResponse = (schema: z.ZodType) => itemResponse(schema.nullable());

export const paginatedResponse = (schema: z.ZodType, extra?: z.ZodObject) => {
  const extras = envelopeExtras(extra);

  return {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean' as const },
      data: toResponseJsonSchema(z.array(schema)),
      pagination: PaginationSchema,
      ...extras.properties
    },
    required: ['success', 'data', 'pagination', ...extras.required]
  };
};

export const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } }
});

export const errorResponses = {
  badRequest: { description: 'Invalid path, query, or body' },
  unauthorized: { description: 'Missing or invalid API key, or the key has no actor' },
  forbidden: { description: 'The key lacks the public_api:* scope' }
};
