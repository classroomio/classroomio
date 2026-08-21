import type { AttachmentListFile } from '@cio/ui';
import type { LessonDocument } from '$features/course/utils/types';

export function getDocumentAttachmentId(document: LessonDocument, index: number): string {
  return document.key || `document-${index}`;
}

export function toAttachmentFiles(documents: LessonDocument[]): AttachmentListFile[] {
  return documents.map((document, index) => ({
    id: getDocumentAttachmentId(document, index),
    name: document.name,
    size: document.size,
    type: document.type
  }));
}

export function getDocumentIndexByAttachmentId(documents: LessonDocument[], attachmentId: string): number {
  return documents.findIndex((document, index) => getDocumentAttachmentId(document, index) === attachmentId);
}

export function mapAttachmentsToDocuments(
  documents: LessonDocument[],
  attachments: AttachmentListFile[]
): LessonDocument[] {
  return attachments
    .map((attachment) => {
      const index = getDocumentIndexByAttachmentId(documents, attachment.id);

      if (index === -1) return null;

      return documents[index];
    })
    .filter((document): document is LessonDocument => document != null);
}
