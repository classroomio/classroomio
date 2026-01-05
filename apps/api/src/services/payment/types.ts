import type { TPaymentProvider, TSupportedCurrency } from '@cio/db/types';

/**
 * Base interface for payment provider implementations
 * This allows us to swap between Stripe and Paystack while keeping the same API
 */
export interface PaymentProviderInterface {
  readonly provider: TPaymentProvider;
  readonly supportedCurrencies: TSupportedCurrency[];

  /**
   * Create a checkout session/payment intent
   */
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;

  /**
   * Verify a payment after webhook/callback
   */
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;

  /**
   * Handle webhook events from the provider
   */
  handleWebhook(params: WebhookParams): Promise<WebhookResult>;

  /**
   * Create a connected account for payouts (Stripe Connect / Paystack Subaccount)
   */
  createConnectedAccount(params: CreateConnectedAccountParams): Promise<CreateConnectedAccountResult>;

  /**
   * Get account link for onboarding (Stripe Connect specific)
   */
  getAccountLink?(params: GetAccountLinkParams): Promise<GetAccountLinkResult>;

  /**
   * Get connected account status
   */
  getAccountStatus(params: GetAccountStatusParams): Promise<AccountStatusResult>;

  /**
   * Create a payout/transfer to connected account
   */
  createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult>;

  /**
   * Refund a payment
   */
  refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult>;
}

// ==================== CHECKOUT ====================

export interface CreateCheckoutParams {
  amount: number; // Amount in smallest currency unit (cents/kobo)
  currency: TSupportedCurrency;
  customerEmail: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  // For split payments to connected accounts
  connectedAccountId?: string;
  applicationFeeAmount?: number;
}

export interface CreateCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  paymentIntentId?: string;
  reference?: string; // Paystack reference
  error?: string;
}

// ==================== VERIFY PAYMENT ====================

export interface VerifyPaymentParams {
  reference?: string; // Paystack reference
  paymentIntentId?: string; // Stripe payment intent ID
  sessionId?: string; // Stripe checkout session ID
}

export interface VerifyPaymentResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  amount?: number;
  currency?: TSupportedCurrency;
  customerEmail?: string;
  metadata?: Record<string, string>;
  error?: string;
}

// ==================== WEBHOOKS ====================

export interface WebhookParams {
  payload: string | Buffer;
  signature: string;
}

export interface WebhookResult {
  success: boolean;
  eventType?: string;
  data?: {
    transactionId?: string;
    paymentIntentId?: string;
    reference?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    amount?: number;
    currency?: TSupportedCurrency;
    customerEmail?: string;
    metadata?: Record<string, string>;
    connectedAccountId?: string;
    payoutId?: string;
  };
  error?: string;
}

// ==================== CONNECTED ACCOUNTS ====================

export interface CreateConnectedAccountParams {
  email: string;
  businessName?: string;
  // Paystack-specific
  bankCode?: string;
  accountNumber?: string;
  percentageCharge?: number;
  // Stripe-specific
  country?: string;
  type?: 'express' | 'standard' | 'custom';
}

export interface CreateConnectedAccountResult {
  success: boolean;
  accountId?: string; // Stripe account ID or Paystack subaccount code
  accountData?: Record<string, unknown>;
  error?: string;
}

export interface GetAccountLinkParams {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}

export interface GetAccountLinkResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface GetAccountStatusParams {
  accountId: string;
}

export interface AccountStatusResult {
  success: boolean;
  isActive: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
  };
  error?: string;
}

// ==================== PAYOUTS ====================

export interface CreatePayoutParams {
  accountId: string; // Connected account ID
  amount: number; // Amount in smallest currency unit
  currency: TSupportedCurrency;
  reference?: string;
  reason?: string;
}

export interface CreatePayoutResult {
  success: boolean;
  payoutId?: string;
  transferCode?: string; // Paystack transfer code
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
}

// ==================== REFUNDS ====================

export interface RefundPaymentParams {
  transactionId?: string;
  paymentIntentId?: string;
  reference?: string;
  amount?: number; // Partial refund amount (optional)
  reason?: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId?: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
}
