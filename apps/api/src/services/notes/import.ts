import { AppError, ErrorCodes } from '@api/utils/errors';
import { marked } from 'marked';
import { createNoteService } from './notes';

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMPORT_EXTENSIONS = ['.md', '.txt', '.docx'] as const;

type SupportedImportExtension = (typeof SUPPORTED_IMPORT_EXTENSIONS)[number];

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function titleFromFileName(fileName: string): string {
  const extension = getFileExtension(fileName);
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  const trimmed = baseName.trim();

  return trimmed || 'Imported note';
}

function assertSupportedImportFile(file: File): SupportedImportExtension {
  const extension = getFileExtension(file.name);

  if (!SUPPORTED_IMPORT_EXTENSIONS.includes(extension as SupportedImportExtension)) {
    throw new AppError('Unsupported file type. Allowed: .md, .txt, .docx', ErrorCodes.VALIDATION_ERROR, 415);
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new AppError('File too large. Maximum size is 5MB', ErrorCodes.VALIDATION_ERROR, 413);
  }

  return extension as SupportedImportExtension;
}

function plainTextToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return '';
  }

  return paragraphs.map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`).join('');
}

async function convertImportFileToHtml(file: File, extension: SupportedImportExtension): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  switch (extension) {
    case '.md': {
      const markdown = buffer.toString('utf-8');
      return marked.parse(markdown) as string;
    }
    case '.txt': {
      const text = buffer.toString('utf-8');
      return plainTextToHtml(text);
    }
    case '.docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ buffer });
      return result.value;
    }
    default:
      throw new AppError('Unsupported file type', ErrorCodes.VALIDATION_ERROR, 415);
  }
}

export async function importNoteService(params: {
  ownerId: string;
  roleId: number;
  organizationId: string;
  file: File;
}) {
  const extension = assertSupportedImportFile(params.file);
  const content = await convertImportFileToHtml(params.file, extension);
  const title = titleFromFileName(params.file.name);

  return createNoteService(params.ownerId, params.roleId, {
    organizationId: params.organizationId,
    title,
    content,
    origin: 'workspace'
  });
}
