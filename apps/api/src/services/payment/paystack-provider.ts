import crypto from 'crypto';
import { env } from '@api/config/env';
import type { TPaymentProvider, TSupportedCurrency } from '@cio/db/types';
import type {
  PaymentProviderInterface,
  CreateCheckoutParams,
  CreateCheckoutResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookParams,
  WebhookResult,
  CreateConnectedAccountParams,
  CreateConnectedAccountResult,
  GetAccountStatusParams,
  AccountStatusResult,
  CreatePayoutParams,
  CreatePayoutResult,
  RefundPaymentParams,
  RefundPaymentResult
} from './types';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Paystack payment provider implementation
 * Handles NGN payments via Paystack and Paystack Subaccounts for payouts
 */
export class PaystackProvider implements PaymentProviderInterface {
  readonly provider: TPaymentProvider = 'paystack';
  readonly supportedCurrencies: TSupportedCurrency[] = ['NGN'];

  private getHeaders(): Record<string, string> {
    if (!env.PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
    return {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  private generateReference(): string {
    return `cio_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    try {
      const reference = this.generateReference();

      // Paystack uses kobo (100 kobo = 1 NGN), amount should already be in kobo
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: params.customerEmail,
          amount: params.amount, // Amount in kobo
          reference,
          callback_url: params.successUrl,
          metadata: {
            ...params.metadata,
            cancel_url: params.cancelUrl,
            customer_name: params.customerName
          },
          // Split payment with subaccount
          ...(params.connectedAccountId && {
            subaccount: params.connectedAccountId,
            // Flat fee or percentage - if applicationFeeAmount is provided, use flat_subaccount
            bearer: 'subaccount',
            transaction_charge: params.applicationFeeAmount
          })
        })
      });

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          error: data.message || 'Failed to initialize transaction'
        };
      }

      return {
        success: true,
        checkoutUrl: data.data.authorization_url,
        reference: data.data.reference
      };
    } catch (error) {
      console.error('Paystack createCheckout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout'
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    try {
      if (!params.reference) {
        return {
          success: false,
          status: 'failed',
          error: 'No reference provided'
        };
      }

      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${params.reference}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          status: 'failed',
          error: data.message || 'Failed to verify transaction'
        };
      }

      const transaction = data.data;
      let status: 'pending' | 'completed' | 'failed' = 'pending';

      if (transaction.status === 'success') {
        status = 'completed';
      } else if (transaction.status === 'failed' || transaction.status === 'abandoned') {
        status = 'failed';
      }

      return {
        success: true,
        status,
        transactionId: transaction.id.toString(),
        amount: transaction.amount,
        currency: transaction.currency?.toUpperCase() as TSupportedCurrency,
        customerEmail: transaction.customer?.email,
        metadata: transaction.metadata || {}
      };
    } catch (error) {
      console.error('Paystack verifyPayment error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to verify payment'
      };
    }
  }

  async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
    try {
      if (!env.PAYSTACK_WEBHOOK_SECRET) {
        throw new Error('PAYSTACK_WEBHOOK_SECRET is not configured');
      }

      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
        .update(typeof params.payload === 'string' ? params.payload : params.payload.toString())
        .digest('hex');

      if (hash !== params.signature) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      const payload = typeof params.payload === 'string' ? JSON.parse(params.payload) : params.payload;
      const event = payload.event;
      const eventData = payload.data;

      switch (event) {
        case 'charge.success': {
          return {
            success: true,
            eventType: event,
            data: {
              transactionId: eventData.id?.toString(),
              reference: eventData.reference,
              status: 'completed',
              amount: eventData.amount,
              currency: eventData.currency?.toUpperCase() as TSupportedCurrency,
              customerEmail: eventData.customer?.email,
              metadata: eventData.metadata || {},
              connectedAccountId: eventData.subaccount?.subaccount_code
            }
          };
        }

        case 'charge.failed': {
          return {
            success: true,
            eventType: event,
            data: {
              transactionId: eventData.id?.toString(),
              reference: eventData.reference,
              status: 'failed',
              amount: eventData.amount,
              currency: eventData.currency?.toUpperCase() as TSupportedCurrency,
              customerEmail: eventData.customer?.email,
              metadata: eventData.metadata || {}
            }
          };
        }

        case 'transfer.success': {
          return {
            success: true,
            eventType: event,
            data: {
              payoutId: eventData.id?.toString(),
              status: 'completed',
              amount: eventData.amount,
              currency: eventData.currency?.toUpperCase() as TSupportedCurrency
            }
          };
        }

        case 'transfer.failed':
        case 'transfer.reversed': {
          return {
            success: true,
            eventType: event,
            data: {
              payoutId: eventData.id?.toString(),
              status: 'failed',
              amount: eventData.amount,
              currency: eventData.currency?.toUpperCase() as TSupportedCurrency
            }
          };
        }

        case 'refund.processed': {
          return {
            success: true,
            eventType: event,
            data: {
              transactionId: eventData.transaction?.id?.toString(),
              status: 'refunded',
              amount: eventData.amount
            }
          };
        }

        default:
          return {
            success: true,
            eventType: event,
            data: { status: 'pending' }
          };
      }
    } catch (error) {
      console.error('Paystack webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      };
    }
  }

  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<CreateConnectedAccountResult> {
    try {
      if (!params.bankCode || !params.accountNumber) {
        return {
          success: false,
          error: 'Bank code and account number are required for Paystack subaccounts'
        };
      }

      const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          business_name: params.businessName || params.email,
          settlement_bank: params.bankCode,
          account_number: params.accountNumber,
          percentage_charge: params.percentageCharge || 0,
          primary_contact_email: params.email
        })
      });

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          error: data.message || 'Failed to create subaccount'
        };
      }

      return {
        success: true,
        accountId: data.data.subaccount_code,
        accountData: {
          businessName: data.data.business_name,
          bankName: data.data.settlement_bank,
          accountNumber: data.data.account_number,
          percentageCharge: data.data.percentage_charge,
          isActive: data.data.is_verified
        }
      };
    } catch (error) {
      console.error('Paystack createConnectedAccount error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subaccount'
      };
    }
  }

  async getAccountStatus(params: GetAccountStatusParams): Promise<AccountStatusResult> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount/${params.accountId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          isActive: false,
          error: data.message || 'Failed to get subaccount status'
        };
      }

      return {
        success: true,
        isActive: data.data.is_verified,
        bankInfo: {
          bankName: data.data.settlement_bank,
          accountNumber: data.data.account_number
        }
      };
    } catch (error) {
      console.error('Paystack getAccountStatus error:', error);
      return {
        success: false,
        isActive: false,
        error: error instanceof Error ? error.message : 'Failed to get account status'
      };
    }
  }

  async createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult> {
    try {
      // First, we need to get the recipient code for the subaccount
      // In Paystack, payouts to subaccounts happen automatically with split payments
      // For manual payouts, we need to create a transfer recipient and then initiate transfer

      // Get subaccount details to get bank info
      const subaccountResponse = await fetch(`${PAYSTACK_BASE_URL}/subaccount/${params.accountId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const subaccountData = await subaccountResponse.json();

      if (!subaccountData.status) {
        return {
          success: false,
          error: 'Failed to get subaccount details'
        };
      }

      // Create a transfer recipient
      const recipientResponse = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'nuban',
          name: subaccountData.data.business_name,
          account_number: subaccountData.data.account_number,
          bank_code: subaccountData.data.settlement_bank,
          currency: params.currency
        })
      });

      const recipientData = await recipientResponse.json();

      if (!recipientData.status) {
        return {
          success: false,
          error: recipientData.message || 'Failed to create transfer recipient'
        };
      }

      // Initiate the transfer
      const transferResponse = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: 'balance',
          amount: params.amount,
          recipient: recipientData.data.recipient_code,
          reason: params.reason || 'Course payout',
          reference: params.reference || this.generateReference()
        })
      });

      const transferData = await transferResponse.json();

      if (!transferData.status) {
        return {
          success: false,
          error: transferData.message || 'Failed to initiate transfer'
        };
      }

      return {
        success: true,
        payoutId: transferData.data.id?.toString(),
        transferCode: transferData.data.transfer_code,
        status: transferData.data.status === 'success' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('Paystack createPayout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payout'
      };
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    try {
      if (!params.transactionId && !params.reference) {
        return {
          success: false,
          error: 'Transaction ID or reference is required'
        };
      }

      const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          transaction: params.transactionId || params.reference,
          amount: params.amount, // Optional partial refund
          merchant_note: params.reason
        })
      });

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          error: data.message || 'Failed to process refund'
        };
      }

      return {
        success: true,
        refundId: data.data.id?.toString(),
        status: data.data.status === 'processed' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('Paystack refundPayment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund payment'
      };
    }
  }

  /**
   * Get list of banks supported by Paystack
   */
  async getBankList(country: string = 'nigeria'): Promise<{ banks: Array<{ name: string; code: string }> }> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=${country}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!data.status) {
        return { banks: [] };
      }

      return {
        banks: data.data.map((bank: { name: string; code: string }) => ({
          name: bank.name,
          code: bank.code
        }))
      };
    } catch (error) {
      console.error('Paystack getBankList error:', error);
      return { banks: [] };
    }
  }

  /**
   * Verify bank account before creating subaccount
   */
  async verifyBankAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      const data = await response.json();

      if (!data.status) {
        return {
          success: false,
          error: data.message || 'Failed to verify account'
        };
      }

      return {
        success: true,
        accountName: data.data.account_name
      };
    } catch (error) {
      console.error('Paystack verifyBankAccount error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify account'
      };
    }
  }
}

export const paystackProvider = new PaystackProvider();
