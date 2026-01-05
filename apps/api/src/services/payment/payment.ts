import { db } from '@cio/db/drizzle';
import { env } from '@api/config/env';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { sendEmail } from '@cio/email';
import {
  createPayoutAccount,
  updatePayoutAccount,
  getPayoutAccountById,
  getPayoutAccountByOrgAndProvider,
  getPayoutAccountsByOrg,
  createPaymentTransaction,
  updatePaymentTransaction,
  getPaymentTransactionById,
  getPaymentTransactionByProviderId,
  getPaymentTransactionByPaymentIntentId,
  getPaymentTransactionsByCourse,
  getPaymentTransactionsByOrg,
  getOrgTotalEarnings,
  getAvailablePayoutBalance,
  createPayout,
  updatePayout,
  getPayoutById,
  getPayoutsByOrg,
  getCourseForPayment,
  hasStudentPaidForCourse
} from '@cio/db/queries/payment';
import { getProfileById } from '@cio/db/queries/auth';
import type { TPaymentProvider, TSupportedCurrency, TPaymentStatus, TPayoutStatus } from '@cio/db/types';
import type { TInitiatePayment, TCreatePayoutAccount } from '@cio/utils/validation/payment';
import { stripeProvider } from './stripe-provider';
import { paystackProvider } from './paystack-provider';
import type { PaymentProviderInterface, WebhookResult } from './types';

// ==================== PROVIDER FACTORY ====================

/**
 * Get the appropriate payment provider based on currency
 * USD -> Stripe, NGN -> Paystack
 */
export function getPaymentProvider(currency: TSupportedCurrency): PaymentProviderInterface {
  switch (currency) {
    case 'USD':
      return stripeProvider;
    case 'NGN':
      return paystackProvider;
    default:
      throw new AppError(`Unsupported currency: ${currency}`, ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Get provider by provider name
 */
export function getProviderByName(provider: TPaymentProvider): PaymentProviderInterface {
  switch (provider) {
    case 'stripe':
      return stripeProvider;
    case 'paystack':
      return paystackProvider;
    default:
      throw new AppError(`Unknown provider: ${provider}`, ErrorCodes.VALIDATION_ERROR, 400);
  }
}

// ==================== PAYMENT SERVICES ====================

/**
 * Initialize a payment for a course purchase
 */
export async function initiatePayment(input: TInitiatePayment) {
  // Get course and organization details
  const courseData = await getCourseForPayment(input.courseId);

  if (!courseData) {
    throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
  }

  const { course, organization } = courseData;

  // Check if student has already paid
  const alreadyPaid = await hasStudentPaidForCourse(input.studentEmail, input.courseId);
  if (alreadyPaid) {
    throw new AppError('You have already purchased this course', ErrorCodes.DUPLICATE_ENTRY, 409);
  }

  // Get the payment provider based on currency
  const provider = getPaymentProvider(input.currency);

  // Calculate platform fee
  const platformFeePercent = env.PLATFORM_FEE_PERCENT || 0;
  const platformFee = Math.floor((input.amount * platformFeePercent) / 100);
  const netAmount = input.amount - platformFee;

  // Get connected account for split payments (if exists)
  const payoutAccount = await getPayoutAccountByOrgAndProvider(organization.id, provider.provider);

  // Create checkout URLs
  const baseUrl = env.SERVER_URL || 'http://localhost:5173';
  const successUrl = input.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = input.cancelUrl || `${baseUrl}/payment/cancel`;

  // Create checkout session with provider
  const checkoutResult = await provider.createCheckout({
    amount: input.amount,
    currency: input.currency,
    customerEmail: input.studentEmail,
    customerName: input.studentName,
    description: `Course: ${course.title}`,
    metadata: {
      courseId: input.courseId,
      organizationId: organization.id,
      courseName: course.title,
      studentEmail: input.studentEmail,
      studentName: input.studentName
    },
    successUrl,
    cancelUrl,
    connectedAccountId: payoutAccount?.providerAccountId,
    applicationFeeAmount: payoutAccount ? platformFee : undefined
  });

  if (!checkoutResult.success) {
    throw new AppError(checkoutResult.error || 'Failed to create checkout', ErrorCodes.PAYMENT_ERROR, 500);
  }

  // Create payment transaction record
  const transaction = await createPaymentTransaction({
    courseId: input.courseId,
    studentEmail: input.studentEmail,
    studentName: input.studentName,
    organizationId: organization.id,
    provider: provider.provider,
    providerTransactionId: checkoutResult.reference || checkoutResult.sessionId,
    providerPaymentIntentId: checkoutResult.paymentIntentId,
    amount: input.amount,
    currency: input.currency,
    platformFee,
    netAmount,
    status: 'pending',
    providerData: {
      stripePaymentIntentId: checkoutResult.paymentIntentId,
      paystackReference: checkoutResult.reference
    }
  });

  return {
    transaction,
    checkoutUrl: checkoutResult.checkoutUrl,
    reference: checkoutResult.reference || checkoutResult.sessionId
  };
}

/**
 * Verify a payment and update transaction status
 */
export async function verifyPayment(transactionId: string, providerReference?: string) {
  const transaction = await getPaymentTransactionById(transactionId);

  if (!transaction) {
    throw new AppError('Transaction not found', ErrorCodes.NOT_FOUND, 404);
  }

  const provider = getProviderByName(transaction.provider);

  const verifyResult = await provider.verifyPayment({
    reference: transaction.providerData?.paystackReference || providerReference,
    sessionId: transaction.providerTransactionId || undefined,
    paymentIntentId: transaction.providerPaymentIntentId || undefined
  });

  if (!verifyResult.success) {
    throw new AppError(verifyResult.error || 'Failed to verify payment', ErrorCodes.PAYMENT_ERROR, 500);
  }

  // Update transaction status
  const updatedTransaction = await updatePaymentTransaction(transactionId, {
    status: verifyResult.status as TPaymentStatus,
    completedAt: verifyResult.status === 'completed' ? new Date().toISOString() : undefined
  });

  // If payment completed, send notifications
  if (verifyResult.status === 'completed') {
    await sendPaymentNotifications(updatedTransaction);
  }

  return updatedTransaction;
}

/**
 * Handle webhook from payment provider
 */
export async function handlePaymentWebhook(
  provider: TPaymentProvider,
  payload: string | Buffer,
  signature: string
): Promise<WebhookResult> {
  const paymentProvider = getProviderByName(provider);
  const result = await paymentProvider.handleWebhook({ payload, signature });

  if (!result.success || !result.data) {
    return result;
  }

  // Find the transaction by provider reference
  let transaction = null;

  if (result.data.transactionId) {
    transaction = await getPaymentTransactionByProviderId(result.data.transactionId);
  }

  if (!transaction && result.data.paymentIntentId) {
    transaction = await getPaymentTransactionByPaymentIntentId(result.data.paymentIntentId);
  }

  if (!transaction && result.data.reference) {
    transaction = await getPaymentTransactionByProviderId(result.data.reference);
  }

  if (transaction) {
    // Update transaction status
    const updatedTransaction = await updatePaymentTransaction(transaction.id, {
      status: result.data.status as TPaymentStatus,
      completedAt: result.data.status === 'completed' ? new Date().toISOString() : undefined,
      providerData: {
        ...transaction.providerData,
        ...(result.data.paymentIntentId && { stripePaymentIntentId: result.data.paymentIntentId }),
        ...(result.data.reference && { paystackReference: result.data.reference })
      }
    });

    // Send notifications on completion
    if (result.data.status === 'completed') {
      await sendPaymentNotifications(updatedTransaction);
    }
  }

  return result;
}

/**
 * Send payment success notifications to student and teacher
 */
async function sendPaymentNotifications(transaction: Awaited<ReturnType<typeof getPaymentTransactionById>>) {
  if (!transaction) return;

  try {
    const courseData = await getCourseForPayment(transaction.courseId);
    if (!courseData) return;

    const { course, organization } = courseData;

    // Format amount for display
    const formattedAmount = formatAmount(transaction.amount, transaction.currency);

    // Send email to student
    await sendEmail('paymentSuccessStudent', {
      to: transaction.studentEmail,
      fields: {
        studentName: transaction.studentName || 'Student',
        courseName: course.title,
        amount: formattedAmount,
        currency: transaction.currency,
        orgName: organization.name,
        transactionId: transaction.id
      }
    });

    // Send email to teacher/organization (get org admin email)
    // For now, we'll use a placeholder - in production, get org admin emails
    const orgAdminEmail = organization.landingpage?.contact?.email;
    if (orgAdminEmail) {
      await sendEmail('paymentSuccessTeacher', {
        to: orgAdminEmail,
        fields: {
          courseName: course.title,
          studentName: transaction.studentName || 'Student',
          studentEmail: transaction.studentEmail,
          amount: formattedAmount,
          currency: transaction.currency,
          netAmount: formatAmount(transaction.netAmount || transaction.amount, transaction.currency),
          transactionId: transaction.id
        }
      });
    }
  } catch (error) {
    console.error('Failed to send payment notifications:', error);
    // Don't throw - notifications failing shouldn't break the payment flow
  }
}

/**
 * Format amount for display
 */
function formatAmount(amount: number, currency: TSupportedCurrency): string {
  // Amount is in smallest unit (cents/kobo), convert to main unit
  const mainAmount = amount / 100;
  const formatter = new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency
  });
  return formatter.format(mainAmount);
}

// ==================== PAYOUT ACCOUNT SERVICES ====================

/**
 * Create a payout account for an organization
 */
export async function createOrgPayoutAccount(input: TCreatePayoutAccount) {
  // Check if account already exists for this provider
  const existingAccount = await getPayoutAccountByOrgAndProvider(input.organizationId, input.provider);

  if (existingAccount) {
    throw new AppError(
      `A ${input.provider} payout account already exists for this organization`,
      ErrorCodes.DUPLICATE_ENTRY,
      409
    );
  }

  const provider = getProviderByName(input.provider);

  // Create connected account with provider
  const accountResult = await provider.createConnectedAccount({
    email: input.accountEmail,
    businessName: input.paystackBusinessName,
    bankCode: input.paystackBankCode,
    accountNumber: input.paystackAccountNumber,
    percentageCharge: input.paystackPercentageCharge
  });

  if (!accountResult.success) {
    throw new AppError(accountResult.error || 'Failed to create payout account', ErrorCodes.PAYMENT_ERROR, 500);
  }

  // Save to database
  const payoutAccount = await createPayoutAccount({
    organizationId: input.organizationId,
    provider: input.provider,
    providerAccountId: accountResult.accountId!,
    currency: input.currency,
    accountName: input.accountName,
    accountEmail: input.accountEmail,
    providerData: {
      ...(input.provider === 'stripe' && {
        stripeAccountId: accountResult.accountId,
        chargesEnabled: accountResult.accountData?.chargesEnabled as boolean,
        payoutsEnabled: accountResult.accountData?.payoutsEnabled as boolean
      }),
      ...(input.provider === 'paystack' && {
        paystackSubaccountCode: accountResult.accountId,
        businessName: accountResult.accountData?.businessName as string,
        bankName: accountResult.accountData?.bankName as string,
        accountNumber: accountResult.accountData?.accountNumber as string,
        percentageCharge: accountResult.accountData?.percentageCharge as number
      })
    },
    isActive: true
  });

  return payoutAccount;
}

/**
 * Get Stripe Connect account link for onboarding
 */
export async function getStripeAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  const account = await getPayoutAccountById(accountId);

  if (!account) {
    throw new AppError('Payout account not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (account.provider !== 'stripe') {
    throw new AppError('Account link is only available for Stripe accounts', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const result = await stripeProvider.getAccountLink({
    accountId: account.providerAccountId,
    returnUrl,
    refreshUrl
  });

  if (!result.success) {
    throw new AppError(result.error || 'Failed to create account link', ErrorCodes.PAYMENT_ERROR, 500);
  }

  return { url: result.url };
}

/**
 * Get payout account status from provider
 */
export async function getPayoutAccountStatus(accountId: string) {
  const account = await getPayoutAccountById(accountId);

  if (!account) {
    throw new AppError('Payout account not found', ErrorCodes.NOT_FOUND, 404);
  }

  const provider = getProviderByName(account.provider);
  const statusResult = await provider.getAccountStatus({ accountId: account.providerAccountId });

  // Update local record if status changed
  if (statusResult.success && statusResult.isActive !== account.isActive) {
    await updatePayoutAccount(accountId, {
      isActive: statusResult.isActive,
      providerData: {
        ...account.providerData,
        chargesEnabled: statusResult.chargesEnabled,
        payoutsEnabled: statusResult.payoutsEnabled
      }
    });
  }

  return {
    ...account,
    providerStatus: statusResult
  };
}

/**
 * Get all payout accounts for an organization
 */
export async function getOrgPayoutAccounts(organizationId: string) {
  return getPayoutAccountsByOrg(organizationId);
}

// ==================== PAYOUT SERVICES ====================

/**
 * Get earnings summary for an organization
 */
export async function getOrgEarningsSummary(organizationId: string) {
  const [usdEarnings, ngnEarnings] = await Promise.all([
    getOrgTotalEarnings(organizationId, 'USD'),
    getOrgTotalEarnings(organizationId, 'NGN')
  ]);

  const [usdAvailable, ngnAvailable] = await Promise.all([
    getAvailablePayoutBalance(organizationId, 'USD'),
    getAvailablePayoutBalance(organizationId, 'NGN')
  ]);

  return {
    USD: {
      totalEarnings: usdEarnings.totalAmount,
      totalNetEarnings: usdEarnings.totalNetAmount,
      transactionCount: usdEarnings.transactionCount,
      availableForPayout: usdAvailable.availableBalance
    },
    NGN: {
      totalEarnings: ngnEarnings.totalAmount,
      totalNetEarnings: ngnEarnings.totalNetAmount,
      transactionCount: ngnEarnings.transactionCount,
      availableForPayout: ngnAvailable.availableBalance
    }
  };
}

/**
 * Get payment transactions for an organization
 */
export async function getOrgTransactions(
  organizationId: string,
  options: { status?: TPaymentStatus; page?: number; limit?: number } = {}
) {
  return getPaymentTransactionsByOrg(organizationId, options);
}

/**
 * Get payment transactions for a course
 */
export async function getCourseTransactions(
  courseId: string,
  options: { status?: TPaymentStatus; page?: number; limit?: number } = {}
) {
  return getPaymentTransactionsByCourse(courseId, options);
}

/**
 * Get payouts for an organization
 */
export async function getOrgPayouts(
  organizationId: string,
  options: { status?: TPayoutStatus; page?: number; limit?: number } = {}
) {
  return getPayoutsByOrg(organizationId, options);
}

// Re-export Paystack-specific functions for bank verification
export { paystackProvider };
