/**
 * Payment System Types
 *
 * This file contains type definitions for the payment provider abstraction layer.
 * The system supports multiple payment providers (Stripe, Paystack) with a unified interface.
 */

import type { TPaymentProvider, TPaymentStatus, TPayoutStatus } from '@cio/db/types';

/**
 * Supported currencies and their providers
 */
export const CURRENCY_PROVIDER_MAP: Record<string, TPaymentProvider> = {
  USD: 'stripe',
  NGN: 'paystack'
} as const;

/**
 * Platform fee percentage (e.g., 10 = 10%)
 */
export const PLATFORM_FEE_PERCENT = 10;

/**
 * Checkout session creation input
 */
export interface CreateCheckoutInput {
  courseId: string;
  courseName: string;
  courseDescription?: string;
  courseImageUrl?: string;
  amount: number; // In smallest currency unit (cents, kobo)
  currency: string;
  customerEmail?: string;
  customerName?: string;
  profileId?: string; // If user is logged in
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Checkout session result
 */
export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: TPaymentProvider;
}

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
  success: boolean;
  paymentId: string;
  status: TPaymentStatus;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Connected account creation input (for Stripe Connect / Paystack Subaccount)
 */
export interface CreateConnectedAccountInput {
  organizationId: string;
  accountName: string;
  email: string;
  country: string;
  currency: string;
  // Paystack-specific fields
  bankCode?: string;
  accountNumber?: string;
  businessName?: string;
  // Stripe-specific redirect URLs
  refreshUrl?: string;
  returnUrl?: string;
}

/**
 * Connected account result
 */
export interface ConnectedAccountResult {
  accountId: string;
  provider: TPaymentProvider;
  isVerified: boolean;
  onboardingUrl?: string; // URL to complete onboarding (Stripe)
  metadata?: Record<string, unknown>;
}

/**
 * Account status check result
 */
export interface AccountStatusResult {
  accountId: string;
  isActive: boolean;
  isVerified: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: string[];
}

/**
 * Payout creation input
 */
export interface CreatePayoutInput {
  paymentAccountId: string;
  organizationId: string;
  amount: number; // In smallest currency unit
  currency: string;
  paymentIds: string[]; // Course payment IDs to include
  description?: string;
}

/**
 * Payout result
 */
export interface PayoutResult {
  payoutId: string;
  status: TPayoutStatus;
  amount: number;
  currency: string;
  estimatedArrival?: Date;
}

/**
 * Refund input
 */
export interface RefundInput {
  paymentId: string;
  amount?: number; // Partial refund amount, full refund if not provided
  reason?: string;
}

/**
 * Refund result
 */
export interface RefundResult {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  currency: string;
}

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'account.updated'
  | 'payout.paid'
  | 'payout.failed'
  // Paystack equivalents
  | 'charge.success'
  | 'charge.failed'
  | 'refund.processed'
  | 'transfer.success'
  | 'transfer.failed';

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: WebhookEventType;
  provider: TPaymentProvider;
  data: Record<string, unknown>;
  rawPayload: unknown;
}

/**
 * Payment provider interface
 *
 * All payment providers must implement this interface to ensure
 * consistent behavior across different payment gateways.
 */
export interface IPaymentProvider {
  readonly provider: TPaymentProvider;

  /**
   * Create a checkout session for course purchase
   */
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResult>;

  /**
   * Verify a payment was successful
   */
  verifyPayment(paymentId: string): Promise<PaymentVerificationResult>;

  /**
   * Create a connected account for receiving payouts
   */
  createConnectedAccount(input: CreateConnectedAccountInput): Promise<ConnectedAccountResult>;

  /**
   * Get the status of a connected account
   */
  getAccountStatus(accountId: string): Promise<AccountStatusResult>;

  /**
   * Create a payout to a connected account
   */
  createPayout(input: CreatePayoutInput, destinationAccountId: string): Promise<PayoutResult>;

  /**
   * Process a refund
   */
  createRefund(input: RefundInput): Promise<RefundResult>;

  /**
   * Verify and parse webhook payload
   */
  verifyWebhook(payload: string, signature: string): Promise<WebhookPayload>;

  /**
   * Get the webhook signature header name
   */
  getWebhookSignatureHeader(): string;
}

/**
 * Convert amount to smallest currency unit
 */
export function toSmallestUnit(amount: number, currency: string): number {
  // Most currencies use 2 decimal places (cents, kobo)
  // Some currencies like JPY use 0 decimal places
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * Convert amount from smallest currency unit to display amount
 */
export function fromSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }
  return amount / 100;
}

/**
 * Calculate platform fee from gross amount
 */
export function calculatePlatformFee(grossAmount: number): number {
  return Math.round((grossAmount * PLATFORM_FEE_PERCENT) / 100);
}

/**
 * Calculate creator amount after platform fee
 */
export function calculateCreatorAmount(grossAmount: number): number {
  const fee = calculatePlatformFee(grossAmount);
  return grossAmount - fee;
}
