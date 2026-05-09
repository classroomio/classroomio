import { desc, eq, sql } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export interface CreditPurchaseInput {
  orgId: string;
  triggeredBy?: string | null;
  provider?: 'polar';
  providerOrderId: string;
  tokens: number;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  payload?: Record<string, unknown>;
}

export async function findCreditPurchaseByOrderId(providerOrderId: string) {
  try {
    const [row] = await db
      .select()
      .from(schema.aiCreditPurchase)
      .where(eq(schema.aiCreditPurchase.providerOrderId, providerOrderId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('findCreditPurchaseByOrderId error:', error);
    throw new Error('Failed to find credit purchase');
  }
}

export async function createCreditPurchase(input: CreditPurchaseInput) {
  try {
    const [row] = await db
      .insert(schema.aiCreditPurchase)
      .values({
        orgId: input.orgId,
        triggeredBy: input.triggeredBy ?? null,
        provider: input.provider ?? 'polar',
        providerOrderId: input.providerOrderId,
        tokens: input.tokens,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        currency: input.currency,
        payload: input.payload ?? null
      })
      .returning();

    return row;
  } catch (error) {
    console.error('createCreditPurchase error:', error);
    throw new Error('Failed to create credit purchase');
  }
}

export async function summarizePurchases(orgId: string) {
  try {
    const [row] = await db
      .select({
        totalPurchasedTokens: sql<number>`COALESCE(SUM(${schema.aiCreditPurchase.tokens}), 0)`,
        totalSpentCents: sql<number>`COALESCE(SUM(${schema.aiCreditPurchase.unitPriceCents} * ${schema.aiCreditPurchase.quantity}), 0)`,
        lastPurchaseAt: sql<string | null>`MAX(${schema.aiCreditPurchase.createdAt})`
      })
      .from(schema.aiCreditPurchase)
      .where(eq(schema.aiCreditPurchase.orgId, orgId));

    return {
      totalPurchasedTokens: Number(row?.totalPurchasedTokens ?? 0),
      totalSpentCents: Number(row?.totalSpentCents ?? 0),
      lastPurchaseAt: row?.lastPurchaseAt ?? null
    };
  } catch (error) {
    console.error('summarizePurchases error:', error);
    throw new Error('Failed to summarize purchases');
  }
}

export async function listCreditPurchases(orgId: string, limit = 50) {
  try {
    return db
      .select()
      .from(schema.aiCreditPurchase)
      .where(eq(schema.aiCreditPurchase.orgId, orgId))
      .orderBy(desc(schema.aiCreditPurchase.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listCreditPurchases error:', error);
    throw new Error('Failed to list credit purchases');
  }
}

/** Inserts purchase row and applies balance in one transaction. Caller checks idempotency first. */
export async function insertCreditPurchaseAndApplyBalance(input: CreditPurchaseInput) {
  try {
    return await db.transaction(async (tx) => {
      const [purchase] = await tx
        .insert(schema.aiCreditPurchase)
        .values({
          orgId: input.orgId,
          triggeredBy: input.triggeredBy ?? null,
          provider: input.provider ?? 'polar',
          providerOrderId: input.providerOrderId,
          tokens: input.tokens,
          quantity: input.quantity,
          unitPriceCents: input.unitPriceCents,
          currency: input.currency,
          payload: input.payload ?? null
        })
        .returning();

      const [existingBalance] = await tx
        .select({ id: schema.aiCreditBalance.id })
        .from(schema.aiCreditBalance)
        .where(eq(schema.aiCreditBalance.orgId, input.orgId))
        .limit(1);

      if (existingBalance) {
        await tx
          .update(schema.aiCreditBalance)
          .set({
            balance: sql`${schema.aiCreditBalance.balance} + ${input.tokens}`,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.aiCreditBalance.orgId, input.orgId));
      } else {
        await tx.insert(schema.aiCreditBalance).values({ orgId: input.orgId, balance: input.tokens });
      }

      return purchase;
    });
  } catch (error) {
    console.error('insertCreditPurchaseAndApplyBalance error:', error);
    throw new Error('Failed to record credit purchase');
  }
}
