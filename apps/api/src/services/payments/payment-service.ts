/**
 * Payment Service
 *
 * Main service for handling course payments. Routes to the appropriate
 * payment provider based on currency and handles database operations.
 */

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { TPaymentProvider, TPaymentStatus, TCoursePayment, TPaymentAccount } from '@cio/db/types';
import { stripeProvider } from './stripe-provider';
import { paystackProvider } from './paystack-provider';
import {
  type IPaymentProvider,
  type CreateCheckoutInput,
  type CheckoutSessionResult,
  type PaymentVerificationResult,
  CURRENCY_PROVIDER_MAP,
  calculatePlatformFee,
  calculateCreatorAmount
} from './types';
import { AppError, ErrorCodes } from '@api/utils/errors';

/**
 * Get the payment provider for a given currency
 */
export function getProviderForCurrency(currency: string): IPaymentProvider {
  const providerName = CURRENCY_PROVIDER_MAP[currency.toUpperCase()];

  if (!providerName) {
    throw new AppError(`Unsupported currency: ${currency}. Supported currencies: USD, NGN`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  switch (providerName) {
    case 'stripe':
      return stripeProvider;
    case 'paystack':
      return paystackProvider;
    default:
      throw new AppError(`Unknown payment provider: ${providerName}`, ErrorCodes.INTERNAL_ERROR, 500);
  }
}

/**
 * Get provider by name
 */
export function getProviderByName(provider: TPaymentProvider): IPaymentProvider {
  switch (provider) {
    case 'stripe':
      return stripeProvider;
    case 'paystack':
      return paystackProvider;
    default:
      throw new AppError(`Unknown payment provider: ${provider}`, ErrorCodes.INTERNAL_ERROR, 500);
  }
}

/**
 * Create a checkout session for course purchase
 */
export async function createCourseCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult & { paymentId: string }> {
  const provider = getProviderForCurrency(input.currency);

  // Create checkout session with the payment provider
  const session = await provider.createCheckoutSession(input);

  // Calculate fees
  const platformFee = calculatePlatformFee(input.amount);
  const creatorAmount = calculateCreatorAmount(input.amount);

  // Create payment record in database
  const [payment] = await db
    .insert(schema.coursePayment)
    .values({
      courseId: input.courseId,
      profileId: input.profileId || '', // Will be updated if user registers
      organizationId: input.organizationId,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      provider: provider.provider,
      providerCheckoutId: session.sessionId,
      status: 'pending',
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      platformFee,
      creatorAmount,
      metadata: {
        checkoutSessionUrl: session.checkoutUrl
      }
    })
    .returning();

  return {
    ...session,
    paymentId: payment.id
  };
}

/**
 * Handle successful payment (called from webhook)
 */
export async function handlePaymentSuccess(
  providerPaymentId: string,
  providerCheckoutId: string | null,
  provider: TPaymentProvider,
  customerEmail?: string,
  customerName?: string
): Promise<TCoursePayment | null> {
  // Find the payment record
  let payment: TCoursePayment | null = null;

  if (providerCheckoutId) {
    const [found] = await db
      .select()
      .from(schema.coursePayment)
      .where(
        and(
          eq(schema.coursePayment.providerCheckoutId, providerCheckoutId),
          eq(schema.coursePayment.provider, provider)
        )
      )
      .limit(1);
    payment = found || null;
  }

  if (!payment && providerPaymentId) {
    const [found] = await db
      .select()
      .from(schema.coursePayment)
      .where(
        and(
          eq(schema.coursePayment.providerPaymentId, providerPaymentId),
          eq(schema.coursePayment.provider, provider)
        )
      )
      .limit(1);
    payment = found || null;
  }

  if (!payment) {
    console.error(`Payment record not found for provider payment: ${providerPaymentId}`);
    return null;
  }

  // Update payment status
  const [updatedPayment] = await db
    .update(schema.coursePayment)
    .set({
      status: 'succeeded',
      providerPaymentId,
      customerEmail: customerEmail || payment.customerEmail,
      customerName: customerName || payment.customerName
    })
    .where(eq(schema.coursePayment.id, payment.id))
    .returning();

  // If user is logged in, enroll them in the course
  if (payment.profileId) {
    await enrollStudentInCourse(payment.courseId, payment.profileId, payment.organizationId);
  }

  return updatedPayment;
}

/**
 * Handle failed payment (called from webhook)
 */
export async function handlePaymentFailure(
  providerPaymentId: string,
  providerCheckoutId: string | null,
  provider: TPaymentProvider,
  failureReason?: string
): Promise<TCoursePayment | null> {
  // Find the payment record
  let payment: TCoursePayment | null = null;

  if (providerCheckoutId) {
    const [found] = await db
      .select()
      .from(schema.coursePayment)
      .where(
        and(
          eq(schema.coursePayment.providerCheckoutId, providerCheckoutId),
          eq(schema.coursePayment.provider, provider)
        )
      )
      .limit(1);
    payment = found || null;
  }

  if (!payment) {
    return null;
  }

  // Update payment status
  const [updatedPayment] = await db
    .update(schema.coursePayment)
    .set({
      status: 'failed',
      providerPaymentId,
      metadata: {
        ...((payment.metadata as Record<string, unknown>) || {}),
        failureReason
      }
    })
    .where(eq(schema.coursePayment.id, payment.id))
    .returning();

  return updatedPayment;
}

/**
 * Verify a payment status
 */
export async function verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
  const [payment] = await db
    .select()
    .from(schema.coursePayment)
    .where(eq(schema.coursePayment.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new AppError('Payment not found', ErrorCodes.NOT_FOUND, 404);
  }

  const provider = getProviderByName(payment.provider);

  // Use provider's checkout ID or payment ID to verify
  const verificationId = payment.providerPaymentId || payment.providerCheckoutId;

  if (!verificationId) {
    return {
      success: false,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    };
  }

  return provider.verifyPayment(verificationId);
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId: string): Promise<TCoursePayment | null> {
  const [payment] = await db
    .select()
    .from(schema.coursePayment)
    .where(eq(schema.coursePayment.id, paymentId))
    .limit(1);

  return payment || null;
}

/**
 * Get payments for a course
 */
export async function getPaymentsForCourse(
  courseId: string,
  status?: TPaymentStatus
): Promise<TCoursePayment[]> {
  const conditions = [eq(schema.coursePayment.courseId, courseId)];

  if (status) {
    conditions.push(eq(schema.coursePayment.status, status));
  }

  return db
    .select()
    .from(schema.coursePayment)
    .where(and(...conditions))
    .orderBy(schema.coursePayment.createdAt);
}

/**
 * Get payments for an organization
 */
export async function getPaymentsForOrganization(
  organizationId: string,
  status?: TPaymentStatus
): Promise<TCoursePayment[]> {
  const conditions = [eq(schema.coursePayment.organizationId, organizationId)];

  if (status) {
    conditions.push(eq(schema.coursePayment.status, status));
  }

  return db
    .select()
    .from(schema.coursePayment)
    .where(and(...conditions))
    .orderBy(schema.coursePayment.createdAt);
}

/**
 * Get payment account for organization
 */
export async function getPaymentAccount(
  organizationId: string,
  provider: TPaymentProvider
): Promise<TPaymentAccount | null> {
  const [account] = await db
    .select()
    .from(schema.paymentAccount)
    .where(
      and(
        eq(schema.paymentAccount.organizationId, organizationId),
        eq(schema.paymentAccount.provider, provider)
      )
    )
    .limit(1);

  return account || null;
}

/**
 * Get all payment accounts for organization
 */
export async function getPaymentAccountsForOrganization(
  organizationId: string
): Promise<TPaymentAccount[]> {
  return db
    .select()
    .from(schema.paymentAccount)
    .where(eq(schema.paymentAccount.organizationId, organizationId));
}

/**
 * Enroll student in course after successful payment
 */
async function enrollStudentInCourse(
  courseId: string,
  profileId: string,
  organizationId: string
): Promise<void> {
  // Get the course's group
  const [course] = await db
    .select({ groupId: schema.course.groupId })
    .from(schema.course)
    .where(eq(schema.course.id, courseId))
    .limit(1);

  if (!course?.groupId) {
    console.error(`Course ${courseId} has no group associated`);
    return;
  }

  // Check if student is already enrolled
  const [existingMember] = await db
    .select()
    .from(schema.groupmember)
    .where(
      and(
        eq(schema.groupmember.groupId, course.groupId),
        eq(schema.groupmember.profileId, profileId)
      )
    )
    .limit(1);

  if (existingMember) {
    console.log(`Student ${profileId} is already enrolled in course ${courseId}`);
    return;
  }

  // Add student to the course group (role_id 3 = student)
  await db.insert(schema.groupmember).values({
    groupId: course.groupId,
    profileId,
    roleId: 3, // Student role
    email: null
  });

  console.log(`Successfully enrolled student ${profileId} in course ${courseId}`);
}

/**
 * Get pending earnings for an organization (successful payments not yet paid out)
 */
export async function getPendingEarnings(organizationId: string): Promise<{
  total: number;
  byCurrency: Record<string, number>;
  paymentCount: number;
}> {
  // Get all successful payments that haven't been paid out
  const payments = await db
    .select()
    .from(schema.coursePayment)
    .leftJoin(schema.payoutItem, eq(schema.coursePayment.id, schema.payoutItem.coursePaymentId))
    .where(
      and(
        eq(schema.coursePayment.organizationId, organizationId),
        eq(schema.coursePayment.status, 'succeeded')
      )
    );

  // Filter out payments that are already in a payout
  const pendingPayments = payments.filter((p) => !p.payout_item);

  const byCurrency: Record<string, number> = {};
  let total = 0;

  for (const p of pendingPayments) {
    const amount = p.course_payment.creatorAmount || 0;
    const currency = p.course_payment.currency;
    byCurrency[currency] = (byCurrency[currency] || 0) + amount;
    total += amount;
  }

  return {
    total,
    byCurrency,
    paymentCount: pendingPayments.length
  };
}
