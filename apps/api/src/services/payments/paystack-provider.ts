/**
 * Paystack Payment Provider
 *
 * Implements the IPaymentProvider interface for Paystack payments.
 * Handles NGN payments, Paystack subaccounts for creator payouts.
 */

import crypto from 'crypto';
import type {
  IPaymentProvider,
  CreateCheckoutInput,
  CheckoutSessionResult,
  PaymentVerificationResult,
  CreateConnectedAccountInput,
  ConnectedAccountResult,
  AccountStatusResult,
  CreatePayoutInput,
  PayoutResult,
  RefundInput,
  RefundResult,
  WebhookPayload
} from './types';
import { PLATFORM_FEE_PERCENT } from './types';
import type { TPaymentProvider } from '@cio/db/types';

const PAYSTACK_API_URL = 'https://api.paystack.co';

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface PaystackTransaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  customer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  metadata?: Record<string, unknown>;
  authorization_url?: string;
}

interface PaystackSubaccount {
  id: number;
  subaccount_code: string;
  business_name: string;
  description: string;
  primary_contact_email: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
  is_verified: boolean;
  active: boolean;
}

interface PaystackTransfer {
  id: number;
  transfer_code: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed' | 'reversed';
}

function getPaystackHeaders(): Record<string, string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY environment variable is not set');
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json'
  };
}

async function paystackRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: Record<string, unknown>
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_API_URL}${endpoint}`, {
    method,
    headers: getPaystackHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Paystack API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

export class PaystackProvider implements IPaymentProvider {
  readonly provider: TPaymentProvider = 'paystack';

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    // Generate unique reference
    const reference = `crs_${input.courseId.slice(0, 8)}_${Date.now()}`;

    const initializeData: Record<string, unknown> = {
      email: input.customerEmail || 'customer@example.com',
      amount: input.amount, // Paystack expects amount in kobo
      currency: input.currency.toUpperCase(),
      reference,
      callback_url: input.successUrl,
      metadata: {
        courseId: input.courseId,
        organizationId: input.organizationId,
        profileId: input.profileId || '',
        courseName: input.courseName,
        cancelUrl: input.cancelUrl,
        ...input.metadata
      }
    };

    // Note: For split payments with subaccounts:
    // subaccount: subaccountCode,
    // transaction_charge: platformFeeInKobo (charge on top)
    // OR
    // bearer: 'subaccount' (customer pays the charge)

    const response = await paystackRequest<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/transaction/initialize', 'POST', initializeData);

    return {
      sessionId: response.data.reference,
      checkoutUrl: response.data.authorization_url,
      provider: 'paystack'
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    const response = await paystackRequest<PaystackTransaction>(`/transaction/verify/${paymentId}`);

    const transaction = response.data;

    const statusMap: Record<string, PaymentVerificationResult['status']> = {
      success: 'succeeded',
      failed: 'failed',
      pending: 'pending',
      abandoned: 'cancelled'
    };

    return {
      success: transaction.status === 'success',
      paymentId: transaction.reference,
      status: statusMap[transaction.status] || 'pending',
      amount: transaction.amount,
      currency: transaction.currency,
      customerEmail: transaction.customer?.email,
      customerName:
        transaction.customer?.first_name && transaction.customer?.last_name
          ? `${transaction.customer.first_name} ${transaction.customer.last_name}`
          : undefined,
      metadata: transaction.metadata
    };
  }

  async createConnectedAccount(input: CreateConnectedAccountInput): Promise<ConnectedAccountResult> {
    if (!input.bankCode || !input.accountNumber) {
      throw new Error('Bank code and account number are required for Paystack subaccounts');
    }

    // Create subaccount for split payments
    const response = await paystackRequest<PaystackSubaccount>('/subaccount', 'POST', {
      business_name: input.businessName || input.accountName,
      settlement_bank: input.bankCode,
      account_number: input.accountNumber,
      percentage_charge: PLATFORM_FEE_PERCENT, // Platform takes this percentage
      primary_contact_email: input.email,
      description: `Payment account for ${input.accountName}`,
      metadata: {
        organizationId: input.organizationId
      }
    });

    return {
      accountId: response.data.subaccount_code,
      provider: 'paystack',
      isVerified: response.data.is_verified,
      metadata: {
        bankName: response.data.settlement_bank,
        accountNumber: response.data.account_number,
        businessName: response.data.business_name
      }
    };
  }

  async getAccountStatus(accountId: string): Promise<AccountStatusResult> {
    const response = await paystackRequest<PaystackSubaccount>(`/subaccount/${accountId}`);

    return {
      accountId: response.data.subaccount_code,
      isActive: response.data.active,
      isVerified: response.data.is_verified,
      chargesEnabled: response.data.active && response.data.is_verified,
      payoutsEnabled: response.data.active && response.data.is_verified,
      requirements: response.data.is_verified ? [] : ['Bank account verification pending']
    };
  }

  async createPayout(input: CreatePayoutInput, destinationAccountId: string): Promise<PayoutResult> {
    // First, create a transfer recipient if not already done
    // For subaccounts, payouts happen automatically via split payments
    // For manual transfers, we need to create a transfer

    // Get subaccount details
    const subaccountResponse = await paystackRequest<PaystackSubaccount>(`/subaccount/${destinationAccountId}`);
    const subaccount = subaccountResponse.data;

    // Create a transfer recipient using the subaccount's bank details
    const recipientResponse = await paystackRequest<{
      recipient_code: string;
      name: string;
      type: string;
    }>('/transferrecipient', 'POST', {
      type: 'nuban',
      name: subaccount.business_name,
      account_number: subaccount.account_number,
      bank_code: subaccount.settlement_bank,
      currency: input.currency
    });

    // Initiate transfer
    const transferResponse = await paystackRequest<PaystackTransfer>('/transfer', 'POST', {
      source: 'balance',
      amount: input.amount,
      recipient: recipientResponse.data.recipient_code,
      reason: input.description || `Payout for ${input.paymentIds.length} course sales`,
      reference: `payout_${input.paymentAccountId.slice(0, 8)}_${Date.now()}`
    });

    const statusMap: Record<string, PayoutResult['status']> = {
      success: 'completed',
      pending: 'processing',
      failed: 'failed',
      reversed: 'failed'
    };

    return {
      payoutId: transferResponse.data.transfer_code,
      status: statusMap[transferResponse.data.status] || 'pending',
      amount: transferResponse.data.amount,
      currency: transferResponse.data.currency
    };
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    // Paystack refunds work differently - need transaction ID
    // First verify the transaction to get the ID
    const verification = await this.verifyPayment(input.paymentId);

    const response = await paystackRequest<{
      id: number;
      transaction: { reference: string };
      amount: number;
      currency: string;
      status: string;
    }>('/refund', 'POST', {
      transaction: input.paymentId,
      amount: input.amount, // Optional, full refund if not provided
      merchant_note: input.reason || 'Customer requested refund'
    });

    return {
      refundId: `refund_${response.data.id}`,
      status:
        response.data.status === 'processed' ? 'succeeded' : response.data.status === 'pending' ? 'pending' : 'failed',
      amount: response.data.amount,
      currency: response.data.currency
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookPayload> {
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('PAYSTACK_WEBHOOK_SECRET environment variable is not set');
    }

    // Verify signature
    const hash = crypto.createHmac('sha512', webhookSecret).update(payload).digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);

    // Map Paystack event types to our standard types
    const eventTypeMap: Record<string, WebhookPayload['event']> = {
      'charge.success': 'charge.success',
      'charge.failed': 'charge.failed',
      'refund.processed': 'refund.processed',
      'transfer.success': 'transfer.success',
      'transfer.failed': 'transfer.failed'
    };

    return {
      event: eventTypeMap[event.event] || (event.event as WebhookPayload['event']),
      provider: 'paystack',
      data: event.data,
      rawPayload: event
    };
  }

  getWebhookSignatureHeader(): string {
    return 'x-paystack-signature';
  }
}

// Export singleton instance
export const paystackProvider = new PaystackProvider();

/**
 * Get list of Nigerian banks for subaccount creation
 */
export async function getNigerianBanks(): Promise<Array<{ code: string; name: string }>> {
  const response = await paystackRequest<Array<{ code: string; name: string }>>('/bank');
  return response.data;
}
