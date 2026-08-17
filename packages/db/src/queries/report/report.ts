import * as schema from '@db/schema';

import type { TContentReport, TNewContentReport } from '@db/types';
import type {
  TContentReportStatus,
  TContentReportTargetType,
  TContentReportReason
} from '@cio/utils/validation/report';
import { and, count, db, desc, eq, inArray } from '@db/drizzle';

const ACTIVE_REPORT_STATUSES: TContentReportStatus[] = ['open', 'in_review'];

export async function findActiveContentReport(input: {
  reporterId: string;
  targetType: TContentReportTargetType;
  targetId: string;
}): Promise<TContentReport | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.contentReport)
      .where(
        and(
          eq(schema.contentReport.reporterId, input.reporterId),
          eq(schema.contentReport.targetType, input.targetType),
          eq(schema.contentReport.targetId, input.targetId),
          inArray(schema.contentReport.status, ACTIVE_REPORT_STATUSES)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('findActiveContentReport error:', error);
    throw new Error(
      `Failed to look up existing content report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createContentReport(data: TNewContentReport): Promise<TContentReport> {
  try {
    const [row] = await db.insert(schema.contentReport).values(data).returning();

    if (!row) {
      throw new Error('Insert returned no content report');
    }

    return row;
  } catch (error) {
    console.error('createContentReport error:', error);
    throw error;
  }
}

export async function getContentReportById(id: string): Promise<TContentReport | null> {
  try {
    const [row] = await db.select().from(schema.contentReport).where(eq(schema.contentReport.id, id)).limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getContentReportById error:', error);
    throw new Error(
      `Failed to get content report "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listContentReports(filters: {
  page: number;
  limit: number;
  status?: TContentReportStatus;
  targetType?: TContentReportTargetType;
  orgId?: string;
  reason?: TContentReportReason;
}): Promise<{ items: TContentReport[]; total: number }> {
  try {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(schema.contentReport.status, filters.status));
    }

    if (filters.targetType) {
      conditions.push(eq(schema.contentReport.targetType, filters.targetType));
    }

    if (filters.orgId) {
      conditions.push(eq(schema.contentReport.organizationId, filters.orgId));
    }

    if (filters.reason) {
      conditions.push(eq(schema.contentReport.reason, filters.reason));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (filters.page - 1) * filters.limit;

    const [totalRow] = await db.select({ total: count() }).from(schema.contentReport).where(whereClause);

    const items = await db
      .select()
      .from(schema.contentReport)
      .where(whereClause)
      .orderBy(schema.contentReport.priority, desc(schema.contentReport.createdAt))
      .limit(filters.limit)
      .offset(offset);

    return {
      items,
      total: Number(totalRow?.total ?? 0)
    };
  } catch (error) {
    console.error('listContentReports error:', error);
    throw new Error(`Failed to list content reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateContentReport(
  id: string,
  data: Partial<
    Pick<
      TContentReport,
      'status' | 'assignedTo' | 'resolutionCode' | 'resolutionNote' | 'reviewedBy' | 'resolvedAt' | 'updatedAt'
    >
  >
): Promise<TContentReport | null> {
  try {
    const [row] = await db.update(schema.contentReport).set(data).where(eq(schema.contentReport.id, id)).returning();

    return row ?? null;
  } catch (error) {
    console.error('updateContentReport error:', error);
    throw new Error(
      `Failed to update content report "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export { ACTIVE_REPORT_STATUSES };
