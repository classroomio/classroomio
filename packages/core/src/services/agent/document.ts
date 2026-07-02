import { nanoid } from 'nanoid';
import { AppError } from '@cio/utils/errors';
import { MAX_DOCUMENT_TEXT_LENGTH, DOCUMENT_REDIS_TTL, SUPPORTED_DOCUMENT_TYPES } from '@cio/ai-assistant';
import type { DocumentUploadResult } from '@cio/ai-assistant';
import { getUploadLimits } from '../../config/upload-limits';
import { agentDocumentKey } from '../../utils/redis-keys';
import { trackAgentEvent, AgentEvent } from '../../utils/tinybird';
import type { RedisClient } from '../../utils/redis/redis';
import { createChatDocument, getChatDocument } from '@cio/db/queries/agent';
import { generateFileKey } from '../../utils/upload';
import { uploadToS3 } from '../../utils/s3';
import { getStorageConfig } from '../../config/storage';
import { createAssetFromUploadService } from '../assets/assets';

/**
 * Parse an uploaded document, store extracted text in Redis (hot cache) and Postgres
 * (durable, scoped to a conversation). Supports PDF, DOCX, PPTX, and ODT files.
 */
export async function parseAndStoreDocument(
  file: File,
  orgId: string,
  userId: string,
  courseId: string,
  conversationId: string,
  redis: RedisClient
): Promise<DocumentUploadResult> {
  const mimeType = file.type;

  if (!SUPPORTED_DOCUMENT_TYPES.includes(mimeType as (typeof SUPPORTED_DOCUMENT_TYPES)[number])) {
    throw new AppError('Unsupported file type. Allowed: PDF, DOCX, PPTX', 'UNSUPPORTED_FILE_TYPE', 415);
  }

  const maxAgentDocumentSize = getUploadLimits().agentDocumentBytes;

  if (file.size > maxAgentDocumentSize) {
    throw new AppError(
      `File too large. Maximum size is ${maxAgentDocumentSize / (1024 * 1024)}MB`,
      'FILE_TOO_LARGE',
      413
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText: string;
  let pageCount: number | null = null;

  switch (mimeType) {
    case 'application/pdf':
      ({ text: extractedText, pageCount } = await extractPdfText(buffer));
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      extractedText = await extractDocxText(buffer);
      break;
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      ({ text: extractedText, pageCount } = await extractPptxText(buffer));
      break;
    case 'application/vnd.oasis.opendocument.text':
      extractedText = await extractOdtText(buffer);
      break;
    default:
      throw new AppError('Unsupported file type', 'UNSUPPORTED_FILE_TYPE', 415);
  }

  const truncated = extractedText.length > MAX_DOCUMENT_TEXT_LENGTH;

  if (truncated) {
    extractedText = extractedText.slice(0, MAX_DOCUMENT_TEXT_LENGTH);
  }

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const textPreview = extractedText.slice(0, 200);
  const documentId = nanoid();

  // Persist the original file to S3 and register it as an asset so it shows
  // up in the org's asset manager — same pipeline lessons use.
  const storageKey = generateFileKey(file.name);
  const storageConfig = getStorageConfig();
  const uploadResult = await uploadToS3({
    Bucket: storageConfig.bucketDocuments,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType
  });

  if (!uploadResult.success) {
    throw new AppError(
      `Failed to upload document to storage: ${uploadResult.error ?? 'unknown error'}`,
      'DOCUMENT_STORAGE_FAILED',
      500
    );
  }

  const asset = await createAssetFromUploadService(orgId, userId, {
    kind: 'document',
    provider: 'upload',
    storageProvider: 's3',
    storageKey,
    byteSize: file.size,
    mimeType,
    title: file.name,
    isExternal: false,
    metadata: { source: 'ai_chat', conversationId }
  });

  await redis.set(
    agentDocumentKey(documentId),
    JSON.stringify({
      text: extractedText,
      fileName: file.name,
      mimeType,
      userId,
      uploadedAt: new Date().toISOString()
    }),
    { EX: DOCUMENT_REDIS_TTL }
  );

  await createChatDocument({
    id: documentId,
    conversationId,
    courseId,
    userId,
    assetId: asset.id,
    fileName: file.name,
    mimeType,
    text: extractedText,
    wordCount,
    pageCount
  });

  trackAgentEvent(AgentEvent.DOCUMENT_UPLOADED, {
    orgId,
    userId,
    courseId,
    mimeType,
    fileSize: file.size,
    wordCount,
    truncated
  });

  return {
    documentId,
    fileName: file.name,
    mimeType,
    pageCount,
    wordCount,
    textPreview,
    truncated
  };
}

/**
 * Retrieve stored document text. Tries the Redis hot cache first; on miss
 * falls back to Postgres and rehydrates Redis for next time.
 */
export async function getDocumentText(documentId: string, userId: string, redis: RedisClient): Promise<string | null> {
  const raw = await redis.get(agentDocumentKey(documentId));

  if (raw) {
    const parsed = JSON.parse(raw) as { text: string; userId?: string };

    if (parsed.userId && parsed.userId !== userId) return null;

    return parsed.text;
  }

  const record = await getChatDocument(documentId, userId);

  if (!record) return null;

  await redis.set(
    agentDocumentKey(documentId),
    JSON.stringify({
      text: record.text,
      fileName: record.fileName,
      mimeType: record.mimeType,
      userId: record.userId,
      uploadedAt: record.createdAt
    }),
    { EX: DOCUMENT_REDIS_TTL }
  );

  return record.text;
}

// ─── Extraction Helpers ──────────────────────────────────────────────────────

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);

  return { text: result.text, pageCount: result.numpages };
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });

  return result.value;
}

async function extractOdtText(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    const contentFile = zip.files['content.xml'];

    if (!contentFile) {
      throw new Error('content.xml not found in ODT archive');
    }

    const xml = await contentFile.async('text');
    const text = xml
      .replace(/<text:line-break[^>]*\/?>/g, '\n')
      .replace(/<\/text:p>/g, '\n')
      .replace(/<\/text:h>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  } catch {
    throw new AppError('Failed to parse ODT file', 'ODT_PARSE_ERROR', 422);
  }
}

async function extractPptxText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // pptx-parser may not be available yet — use a simpler approach
  // For now, try to use officegen or a basic XML extraction
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    const slideTexts: string[] = [];
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort();

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text');
      // Extract text from XML by stripping tags
      const textContent = content
        .replace(/<a:t[^>]*>/g, '')
        .replace(/<\/a:t>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (textContent) {
        slideTexts.push(textContent);
      }
    }

    return { text: slideTexts.join('\n\n---\n\n'), pageCount: slideFiles.length };
  } catch {
    throw new AppError('Failed to parse PPTX file', 'PPTX_PARSE_ERROR', 422);
  }
}
