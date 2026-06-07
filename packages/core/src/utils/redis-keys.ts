/**
 * Pure (no HTTP context) redis key helpers used by the agent runtime.
 *
 * The full key-generator set lives in `apps/api/src/utils/redis/key-generators.ts`
 * because most of them take a Hono `Context` to derive client identity. The
 * agent runtime only needs the context-free subset, kept here so this package
 * stays free of hono deps.
 */

/**
 * Redis key for storing extracted document text from AI assistant uploads.
 * TTL: 3600 seconds (1 hour).
 */
export const agentDocumentKey = (documentId: string): string => {
  return `agent:document:${documentId}`;
};
