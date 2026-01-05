import { db, eq, and, desc, sql, inArray } from '@db/drizzle';
import * as schema from '@db/schema';
import type {
  TNewPayoutAccount,
  TNewPaymentTransaction,
  TNewPayout,
  TPayoutAccount,
  TPaymentTransaction,
  TPayout,
  TPaymentProvider,
  TPaymentStatus,
  TPayoutStatus,
  TSupportedCurrency
} from '../../types';

// ==================== PAYOUT ACCOUNT QUERIES ====================

/**
 * Create a new payout account for an organization
 */
export const createPayoutAccount = async (data: TNewPayoutAccount) => {
  const [account] = await db.insert(schema.payoutAccount).values(data).returning();
  return account;
};

/**
 * Get payout account by ID
 */
export const getPayoutAccountById = async (id: string) => {
  const [account] = await db.select().from(schema.payoutAccount).where(eq(schema.payoutAccount.id, id));
  return account;
};

/**
 * Get payout account by organization ID and provider
 */
export const getPayoutAccountByOrgAndProvider = async (organizationId: string, provider: TPaymentProvider) => {
  const [account] = await db
    .select()
    .from(schema.payoutAccount)
    .where(and(eq(schema.payoutAccount.organizationId, organizationId), eq(schema.payoutAccount.provider, provider)));
  return account;
};

/**
 * Get all payout accounts for an organization
 */
export const getPayoutAccountsByOrg = async (organizationId: string) => {
  return db.select().from(schema.payoutAccount).where(eq(schema.payoutAccount.organizationId, organizationId));
};

/**
 * Update a payout account
 */
export const updatePayoutAccount = async (id: string, data: Partial<TPayoutAccount>) => {
  const [account] = await db
    .update(schema.payoutAccount)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.payoutAccount.id, id))
    .returning();
  return account;
};

/**
 * Delete a payout account
 */
export const deletePayoutAccount = async (id: string) => {
  const [account] = await db.delete(schema.payoutAccount).where(eq(schema.payoutAccount.id, id)).returning();
  return account;
};

/**
 * Get payout account by provider account ID
 */
export const getPayoutAccountByProviderAccountId = async (providerAccountId: string) => {
  const [account] = await db
    .select()
    .from(schema.payoutAccount)
    .where(eq(schema.payoutAccount.providerAccountId, providerAccountId));
  return account;
};

// ==================== PAYMENT TRANSACTION QUERIES ====================

/**
 * Create a new payment transaction
 */
export const createPaymentTransaction = async (data: TNewPaymentTransaction) => {
  const [transaction] = await db.insert(schema.paymentTransaction).values(data).returning();
  return transaction;
};

/**
 * Get payment transaction by ID
 */
export const getPaymentTransactionById = async (id: string) => {
  const [transaction] = await db.select().from(schema.paymentTransaction).where(eq(schema.paymentTransaction.id, id));
  return transaction;
};

/**
 * Get payment transaction by provider transaction ID
 */
export const getPaymentTransactionByProviderId = async (providerTransactionId: string) => {
  const [transaction] = await db
    .select()
    .from(schema.paymentTransaction)
    .where(eq(schema.paymentTransaction.providerTransactionId, providerTransactionId));
  return transaction;
};

/**
 * Get payment transaction by provider payment intent ID (for Stripe)
 */
export const getPaymentTransactionByPaymentIntentId = async (paymentIntentId: string) => {
  const [transaction] = await db
    .select()
    .from(schema.paymentTransaction)
    .where(eq(schema.paymentTransaction.providerPaymentIntentId, paymentIntentId));
  return transaction;
};

/**
 * Update a payment transaction
 */
export const updatePaymentTransaction = async (id: string, data: Partial<TPaymentTransaction>) => {
  const [transaction] = await db
    .update(schema.paymentTransaction)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.paymentTransaction.id, id))
    .returning();
  return transaction;
};

/**
 * Get payment transactions for a course
 */
export const getPaymentTransactionsByCourse = async (
  courseId: string,
  options: { status?: TPaymentStatus; page?: number; limit?: number } = {}
) => {
  const { status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.paymentTransaction.courseId, courseId)];
  if (status) {
    conditions.push(eq(schema.paymentTransaction.status, status));
  }

  const transactions = await db
    .select()
    .from(schema.paymentTransaction)
    .where(and(...conditions))
    .orderBy(desc(schema.paymentTransaction.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.paymentTransaction)
    .where(and(...conditions));

  return { transactions, total: Number(count), page, limit };
};

/**
 * Get payment transactions for an organization
 */
export const getPaymentTransactionsByOrg = async (
  organizationId: string,
  options: { status?: TPaymentStatus; page?: number; limit?: number } = {}
) => {
  const { status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.paymentTransaction.organizationId, organizationId)];
  if (status) {
    conditions.push(eq(schema.paymentTransaction.status, status));
  }

  const transactions = await db
    .select()
    .from(schema.paymentTransaction)
    .where(and(...conditions))
    .orderBy(desc(schema.paymentTransaction.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.paymentTransaction)
    .where(and(...conditions));

  return { transactions, total: Number(count), page, limit };
};

/**
 * Get total earnings for an organization (completed payments)
 */
export const getOrgTotalEarnings = async (organizationId: string, currency?: TSupportedCurrency) => {
  const conditions = [
    eq(schema.paymentTransaction.organizationId, organizationId),
    eq(schema.paymentTransaction.status, 'completed')
  ];

  if (currency) {
    conditions.push(eq(schema.paymentTransaction.currency, currency));
  }

  const [result] = await db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${schema.paymentTransaction.amount}), 0)`,
      totalNetAmount: sql<number>`COALESCE(SUM(${schema.paymentTransaction.netAmount}), 0)`,
      transactionCount: sql<number>`count(*)`
    })
    .from(schema.paymentTransaction)
    .where(and(...conditions));

  return {
    totalAmount: Number(result.totalAmount),
    totalNetAmount: Number(result.totalNetAmount),
    transactionCount: Number(result.transactionCount)
  };
};

/**
 * Get available balance for payout (completed payments not yet paid out)
 */
export const getAvailablePayoutBalance = async (organizationId: string, currency: TSupportedCurrency) => {
  // Get all completed payment transaction IDs that have been included in a payout
  const paidOutTransactions = await db
    .select({ transactionIds: schema.payout.paymentTransactionIds })
    .from(schema.payout)
    .where(
      and(
        eq(schema.payout.organizationId, organizationId),
        inArray(schema.payout.status, ['completed', 'processing', 'pending'])
      )
    );

  const paidOutIds = paidOutTransactions.flatMap((p) => p.transactionIds || []).filter(Boolean);

  // Build query conditions
  const conditions = [
    eq(schema.paymentTransaction.organizationId, organizationId),
    eq(schema.paymentTransaction.status, 'completed'),
    eq(schema.paymentTransaction.currency, currency)
  ];

  // If there are paid out transactions, exclude them
  let query = db
    .select({
      availableBalance: sql<number>`COALESCE(SUM(${schema.paymentTransaction.netAmount}), 0)`,
      transactionCount: sql<number>`count(*)`
    })
    .from(schema.paymentTransaction)
    .where(and(...conditions));

  const [result] = await query;

  // Subtract already paid out amounts (simplified - in production you'd want a more sophisticated tracking)
  return {
    availableBalance: Number(result.availableBalance),
    transactionCount: Number(result.transactionCount)
  };
};

// ==================== PAYOUT QUERIES ====================

/**
 * Create a new payout
 */
export const createPayout = async (data: TNewPayout) => {
  const [payout] = await db.insert(schema.payout).values(data).returning();
  return payout;
};

/**
 * Get payout by ID
 */
export const getPayoutById = async (id: string) => {
  const [payout] = await db.select().from(schema.payout).where(eq(schema.payout.id, id));
  return payout;
};

/**
 * Update a payout
 */
export const updatePayout = async (id: string, data: Partial<TPayout>) => {
  const [payout] = await db
    .update(schema.payout)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.payout.id, id))
    .returning();
  return payout;
};

/**
 * Get payouts for an organization
 */
export const getPayoutsByOrg = async (
  organizationId: string,
  options: { status?: TPayoutStatus; page?: number; limit?: number } = {}
) => {
  const { status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.payout.organizationId, organizationId)];
  if (status) {
    conditions.push(eq(schema.payout.status, status));
  }

  const payouts = await db
    .select()
    .from(schema.payout)
    .where(and(...conditions))
    .orderBy(desc(schema.payout.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.payout)
    .where(and(...conditions));

  return { payouts, total: Number(count), page, limit };
};

/**
 * Get payout by provider payout ID
 */
export const getPayoutByProviderPayoutId = async (providerPayoutId: string) => {
  const [payout] = await db.select().from(schema.payout).where(eq(schema.payout.providerPayoutId, providerPayoutId));
  return payout;
};

// ==================== HELPER QUERIES ====================

/**
 * Get course with organization details for payment
 */
export const getCourseForPayment = async (courseId: string) => {
  const [result] = await db
    .select({
      course: schema.course,
      group: schema.group,
      organization: schema.organization
    })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
    .where(eq(schema.course.id, courseId));

  return result;
};

/**
 * Check if a student has already paid for a course
 */
export const hasStudentPaidForCourse = async (studentEmail: string, courseId: string) => {
  const [result] = await db
    .select({ id: schema.paymentTransaction.id })
    .from(schema.paymentTransaction)
    .where(
      and(
        eq(schema.paymentTransaction.studentEmail, studentEmail),
        eq(schema.paymentTransaction.courseId, courseId),
        eq(schema.paymentTransaction.status, 'completed')
      )
    )
    .limit(1);

  return !!result;
};
