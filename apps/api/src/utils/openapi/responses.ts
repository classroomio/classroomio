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

export const ItemResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

export const PaginatedListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: PaginationSchema
  },
  required: ['success', 'data', 'pagination']
};

const toResponseJsonSchema = (schema: z.ZodType) => {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' });
  return jsonSchema;
};

export const itemResponse = (schema: z.ZodType) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: toResponseJsonSchema(schema)
  },
  required: ['success', 'data']
});

export const nullableItemResponse = (schema: z.ZodType) => itemResponse(schema.nullable());

export const paginatedResponse = (schema: z.ZodType) => ({
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: toResponseJsonSchema(z.array(schema)),
    pagination: PaginationSchema
  },
  required: ['success', 'data', 'pagination']
});

export const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } }
});

export const errorResponses = {
  badRequest: { description: 'Invalid path, query, or body' },
  unauthorized: { description: 'Missing or invalid API key, or the key has no actor' },
  forbidden: { description: 'The key lacks the public_api:* scope' }
};
