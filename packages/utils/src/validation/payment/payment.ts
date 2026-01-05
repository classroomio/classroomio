import * as z from 'zod';

// Supported payment providers
export const PAYMENT_PROVIDERS = ['stripe', 'paystack'] as const;
export const ZPaymentProvider = z.enum(PAYMENT_PROVIDERS);
export type TPaymentProvider = z.infer<typeof ZPaymentProvider>;

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'NGN'] as const;
export const ZSupportedCurrency = z.enum(SUPPORTED_CURRENCIES);
export type TSupportedCurrency = z.infer<typeof ZSupportedCurrency>;

// Payment status
export const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'] as const;
export const ZPaymentStatus = z.enum(PAYMENT_STATUSES);
export type TPaymentStatus = z.infer<typeof ZPaymentStatus>;

// Payout status
export const PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export const ZPayoutStatus = z.enum(PAYOUT_STATUSES);
export type TPayoutStatus = z.infer<typeof ZPayoutStatus>;

/**
 * Schema for initiating a payment (checkout)
 */
export const ZInitiatePayment = z.object({
  courseId: z.string().uuid(),
  studentEmail: z.string().email(),
  studentName: z.string().min(1),
  // Amount in smallest currency unit (cents/kobo)
  amount: z.number().int().positive(),
  currency: ZSupportedCurrency,
  // Optional: redirect URLs for after payment
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});
export type TInitiatePayment = z.infer<typeof ZInitiatePayment>;

/**
 * Schema for payment webhook data
 */
export const ZPaymentWebhook = z.object({
  provider: ZPaymentProvider,
  eventType: z.string(),
  payload: z.record(z.string(), z.unknown())
});
export type TPaymentWebhook = z.infer<typeof ZPaymentWebhook>;

/**
 * Schema for verifying payment
 */
export const ZVerifyPayment = z.object({
  transactionId: z.string().uuid(),
  providerReference: z.string().optional()
});
export type TVerifyPayment = z.infer<typeof ZVerifyPayment>;

/**
 * Schema for creating a payout account (Stripe Connect or Paystack Subaccount)
 */
export const ZCreatePayoutAccount = z.object({
  organizationId: z.string().uuid(),
  provider: ZPaymentProvider,
  currency: ZSupportedCurrency,
  // Common fields
  accountName: z.string().min(1),
  accountEmail: z.string().email(),
  // Stripe-specific fields (for Stripe Connect onboarding)
  stripeReturnUrl: z.string().url().optional(),
  stripeRefreshUrl: z.string().url().optional(),
  // Paystack-specific fields (for Paystack Subaccount)
  paystackBankCode: z.string().optional(),
  paystackAccountNumber: z.string().optional(),
  paystackBusinessName: z.string().optional(),
  paystackPercentageCharge: z.number().min(0).max(100).optional()
});
export type TCreatePayoutAccount = z.infer<typeof ZCreatePayoutAccount>;

/**
 * Schema for updating a payout account
 */
export const ZUpdatePayoutAccount = z.object({
  accountId: z.string().uuid(),
  accountName: z.string().min(1).optional(),
  accountEmail: z.string().email().optional(),
  isActive: z.boolean().optional(),
  // Paystack-specific updates
  paystackPercentageCharge: z.number().min(0).max(100).optional()
});
export type TUpdatePayoutAccount = z.infer<typeof ZUpdatePayoutAccount>;

/**
 * Schema for Stripe Connect account link request
 */
export const ZStripeConnectLink = z.object({
  organizationId: z.string().uuid(),
  returnUrl: z.string().url(),
  refreshUrl: z.string().url()
});
export type TStripeConnectLink = z.infer<typeof ZStripeConnectLink>;

/**
 * Schema for Paystack bank list request
 */
export const ZPaystackBankList = z.object({
  country: z.enum(['nigeria', 'ghana', 'south_africa', 'kenya']).default('nigeria')
});
export type TPaystackBankList = z.infer<typeof ZPaystackBankList>;

/**
 * Schema for getting payout account status
 */
export const ZPayoutAccountStatus = z.object({
  organizationId: z.string().uuid(),
  provider: ZPaymentProvider.optional()
});
export type TPayoutAccountStatus = z.infer<typeof ZPayoutAccountStatus>;

/**
 * Schema for requesting a payout
 */
export const ZRequestPayout = z.object({
  payoutAccountId: z.string().uuid(),
  amount: z.number().int().positive().optional() // If not provided, payout all available balance
});
export type TRequestPayout = z.infer<typeof ZRequestPayout>;

/**
 * Schema for payment transaction query
 */
export const ZPaymentTransactionQuery = z.object({
  organizationId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: ZPaymentStatus.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
export type TPaymentTransactionQuery = z.infer<typeof ZPaymentTransactionQuery>;

/**
 * Schema for payout query
 */
export const ZPayoutQuery = z.object({
  organizationId: z.string().uuid().optional(),
  status: ZPayoutStatus.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
export type TPayoutQuery = z.infer<typeof ZPayoutQuery>;
