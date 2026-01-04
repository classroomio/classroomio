/**
 * Payment Validation Schemas
 *
 * Zod schemas for validating payment-related API requests.
 */

import * as z from 'zod';

/**
 * Create checkout session
 */
export const ZCreateCheckout = z.object({
  courseId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().min(1).optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

export type TCreateCheckout = z.infer<typeof ZCreateCheckout>;

/**
 * Verify payment
 */
export const ZVerifyPayment = z.object({
  paymentId: z.string().uuid()
});

export type TVerifyPayment = z.infer<typeof ZVerifyPayment>;

/**
 * Create payment account (Stripe Connect / Paystack Subaccount)
 */
export const ZCreatePaymentAccount = z.object({
  accountName: z.string().min(1),
  email: z.string().email(),
  country: z.string().length(2), // ISO 3166-1 alpha-2 code
  currency: z.enum(['USD', 'NGN']),
  // Paystack-specific fields (required for NGN)
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  businessName: z.string().optional(),
  // Stripe-specific fields
  refreshUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional()
}).refine(
  (data) => {
    // For NGN (Paystack), bank details are required
    if (data.currency === 'NGN') {
      return !!data.bankCode && !!data.accountNumber;
    }
    return true;
  },
  {
    message: 'Bank code and account number are required for NGN currency',
    path: ['bankCode']
  }
);

export type TCreatePaymentAccount = z.infer<typeof ZCreatePaymentAccount>;

/**
 * Get Stripe onboarding link
 */
export const ZGetStripeOnboarding = z.object({
  refreshUrl: z.string().url(),
  returnUrl: z.string().url()
});

export type TGetStripeOnboarding = z.infer<typeof ZGetStripeOnboarding>;

/**
 * Create payout
 */
export const ZCreatePayout = z.object({
  currency: z.enum(['USD', 'NGN']),
  paymentIds: z.array(z.string().uuid()).optional() // If not provided, includes all pending payments
});

export type TCreatePayout = z.infer<typeof ZCreatePayout>;

/**
 * Get payments query params
 */
export const ZGetPaymentsQuery = z.object({
  courseId: z.string().uuid().optional(),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'cancelled']).optional()
});

export type TGetPaymentsQuery = z.infer<typeof ZGetPaymentsQuery>;

/**
 * Get payouts query params
 */
export const ZGetPayoutsQuery = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional()
});

export type TGetPayoutsQuery = z.infer<typeof ZGetPayoutsQuery>;

/**
 * Process refund
 */
export const ZProcessRefund = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(), // Partial refund, full refund if not provided
  reason: z.string().optional()
});

export type TProcessRefund = z.infer<typeof ZProcessRefund>;
