import { randomBytes } from 'node:crypto';
import { and, count, eq } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { getPostgresError } from '@cio/utils/errors';

import * as schema from '../../schema';
import type { TLearningPathCertificateIssue, TNewLearningPathCertificateIssue } from '../../types';
import {
  CERTIFICATE_SEQ_PLACEHOLDER,
  CERTIFICATE_SEQ_TAIL_LENGTH,
  ensureCertificateIdFormat,
  formatCertificateId
} from '@cio/utils/functions';

/**
 * Issues a learning path completion certificate idempotently.
 * Automatically retries with a random suffix if a certificate ID collision occurs.
 */
export async function issueLearningPathCertificate(
  data: {
    learningPathId: string;
    learningPathMemberId: string;
    profileId: string;
    title: string;
    issuer?: string | null;
    idFormat?: string;
    fileUrl?: string | null;
  },
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCertificateIssue> {
  try {
    const issuedAtDate = new Date();
    const nowIso = issuedAtDate.toISOString();
    const hasSeqPlaceholder = ensureCertificateIdFormat(data.idFormat).includes(CERTIFICATE_SEQ_PLACEHOLDER);
    const MAX_CERTIFICATE_ID_ATTEMPTS = 5;
    let certificateId = formatCertificateId(data.idFormat, data.learningPathMemberId, issuedAtDate);

    for (let attempt = 0; attempt < MAX_CERTIFICATE_ID_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const fallbackSeq = randomBytes(4).toString('hex').toUpperCase();
        const rendered = formatCertificateId(data.idFormat, fallbackSeq, issuedAtDate);

        // Formats without {seq} render the same value for every sequence,
        // so append a suffix to guarantee the retry differs.
        certificateId = hasSeqPlaceholder
          ? rendered
          : `${rendered}-${fallbackSeq.slice(0, CERTIFICATE_SEQ_TAIL_LENGTH)}`;
      }

      const payload: TNewLearningPathCertificateIssue = {
        learningPathId: data.learningPathId,
        learningPathMemberId: data.learningPathMemberId,
        profileId: data.profileId,
        certificateId,
        title: data.title,
        issuer: data.issuer ?? null,
        issuedAt: nowIso,
        status: 'valid',
        fileUrl: data.fileUrl ?? null
      };

      try {
        const [created] = await dbClient
          .insert(schema.learningPathCertificateIssue)
          .values(payload)
          .onConflictDoNothing({
            target: [schema.learningPathCertificateIssue.learningPathMemberId]
          })
          .returning();

        if (created) {
          return created;
        }
      } catch (error) {
        const postgresError = getPostgresError(error);

        if (postgresError?.code === '23505' && attempt + 1 < MAX_CERTIFICATE_ID_ATTEMPTS) {
          continue;
        }

        throw error;
      }

      break;
    }

    const [existing] = await dbClient
      .select()
      .from(schema.learningPathCertificateIssue)
      .where(eq(schema.learningPathCertificateIssue.learningPathMemberId, data.learningPathMemberId))
      .limit(1);

    if (!existing) {
      throw new Error('Failed to issue learning path certificate');
    }

    return existing;
  } catch (error) {
    console.error('issueLearningPathCertificate error:', error);
    throw new Error(
      `Failed to issue learning path certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieves a certificate issue by member UUID.
 */
export async function getLearningPathCertificate(
  learningPathMemberId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCertificateIssue | null> {
  try {
    const [cert] = await dbClient
      .select()
      .from(schema.learningPathCertificateIssue)
      .where(eq(schema.learningPathCertificateIssue.learningPathMemberId, learningPathMemberId))
      .limit(1);

    return cert || null;
  } catch (error) {
    console.error('getLearningPathCertificate error:', error);
    throw new Error(
      `Failed to get certificate for member "${learningPathMemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieves a certificate issue by public certificate ID.
 */
export async function getLearningPathCertificateByCertificateId(
  certificateId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCertificateIssue | null> {
  try {
    const [row] = await dbClient
      .select({ cert: schema.learningPathCertificateIssue })
      .from(schema.learningPathCertificateIssue)
      .innerJoin(schema.learningPath, eq(schema.learningPathCertificateIssue.learningPathId, schema.learningPath.id))
      .where(
        and(
          eq(schema.learningPathCertificateIssue.certificateId, certificateId),
          eq(schema.learningPath.status, 'ACTIVE')
        )
      )
      .limit(1);

    return row?.cert || null;
  } catch (error) {
    console.error('getLearningPathCertificateByCertificateId error:', error);
    throw new Error(
      `Failed to get certificate by certificate ID "${certificateId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TLearningPathCertificateVerification = {
  certificateId: string;
  title: string;
  issuer: string | null;
  issuedAt: string;
  status: string;
  fileUrl: string | null;
  recipientName: string;
  learningPathName: string;
};

/**
 * Retrieves public certificate verification details joined with recipient and path details.
 */
export async function getLearningPathCertificateVerification(
  certificateId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCertificateVerification | null> {
  try {
    const [row] = await dbClient
      .select({
        certificateId: schema.learningPathCertificateIssue.certificateId,
        title: schema.learningPathCertificateIssue.title,
        issuer: schema.learningPathCertificateIssue.issuer,
        issuedAt: schema.learningPathCertificateIssue.issuedAt,
        status: schema.learningPathCertificateIssue.status,
        fileUrl: schema.learningPathCertificateIssue.fileUrl,
        recipientName: schema.profile.fullname,
        learningPathName: schema.learningPath.name
      })
      .from(schema.learningPathCertificateIssue)
      .innerJoin(schema.profile, eq(schema.learningPathCertificateIssue.profileId, schema.profile.id))
      .innerJoin(schema.learningPath, eq(schema.learningPathCertificateIssue.learningPathId, schema.learningPath.id))
      .where(
        and(
          eq(schema.learningPathCertificateIssue.certificateId, certificateId),
          eq(schema.learningPath.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      certificateId: row.certificateId,
      title: row.title,
      issuer: row.issuer,
      issuedAt: row.issuedAt,
      status: row.status,
      fileUrl: row.fileUrl,
      recipientName: row.recipientName || 'Student',
      learningPathName: row.learningPathName
    };
  } catch (error) {
    console.error('getLearningPathCertificateVerification error:', error);
    throw new Error(
      `Failed to verify certificate "${certificateId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Counts the total valid certificates issued for a given learning path.
 */
export async function countIssuedCertificates(learningPathId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [result] = await dbClient
      .select({ total: count() })
      .from(schema.learningPathCertificateIssue)
      .where(
        and(
          eq(schema.learningPathCertificateIssue.learningPathId, learningPathId),
          eq(schema.learningPathCertificateIssue.status, 'valid')
        )
      );

    return result?.total ?? 0;
  } catch (error) {
    console.error('countIssuedCertificates error:', error);
    throw new Error(
      `Failed to count issued certificates for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
