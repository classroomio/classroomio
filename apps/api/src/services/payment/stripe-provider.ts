import Stripe from 'stripe';
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
  GetAccountLinkParams,
  GetAccountLinkResult,
  GetAccountStatusParams,
  AccountStatusResult,
  CreatePayoutParams,
  CreatePayoutResult,
  RefundPaymentParams,
  RefundPaymentResult
} from './types';

/**
 * Stripe payment provider implementation
 * Handles USD payments via Stripe Checkout and Stripe Connect for payouts
 */
export class StripeProvider implements PaymentProviderInterface {
  readonly provider: TPaymentProvider = 'stripe';
  readonly supportedCurrencies: TSupportedCurrency[] = ['USD'];

  private stripe: Stripe | null = null;

  private getStripe(): Stripe {
    if (!this.stripe) {
      if (!env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
    }
    return this.stripe;
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    try {
      const stripe = this.getStripe();

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: params.customerEmail,
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: params.description || 'Course Purchase'
              },
              unit_amount: params.amount
            },
            quantity: 1
          }
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {}
      };

      // If we have a connected account, use Stripe Connect for split payments
      if (params.connectedAccountId && params.applicationFeeAmount) {
        sessionParams.payment_intent_data = {
          application_fee_amount: params.applicationFeeAmount,
          transfer_data: {
            destination: params.connectedAccountId
          }
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return {
        success: true,
        checkoutUrl: session.url || undefined,
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined
      };
    } catch (error) {
      console.error('Stripe createCheckout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    try {
      const stripe = this.getStripe();

      if (params.sessionId) {
        const session = await stripe.checkout.sessions.retrieve(params.sessionId, {
          expand: ['payment_intent']
        });

        const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;

        return {
          success: true,
          status: session.payment_status === 'paid' ? 'completed' : 'pending',
          transactionId: session.id,
          amount: session.amount_total || undefined,
          currency: session.currency?.toUpperCase() as TSupportedCurrency,
          customerEmail: session.customer_email || undefined,
          metadata: (session.metadata as Record<string, string>) || {}
        };
      }

      if (params.paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

        let status: 'pending' | 'completed' | 'failed' = 'pending';
        if (paymentIntent.status === 'succeeded') {
          status = 'completed';
        } else if (['canceled', 'requires_payment_method'].includes(paymentIntent.status)) {
          status = 'failed';
        }

        return {
          success: true,
          status,
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase() as TSupportedCurrency,
          metadata: (paymentIntent.metadata as Record<string, string>) || {}
        };
      }

      return {
        success: false,
        status: 'failed',
        error: 'No session ID or payment intent ID provided'
      };
    } catch (error) {
      console.error('Stripe verifyPayment error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to verify payment'
      };
    }
  }

  async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
    try {
      const stripe = this.getStripe();

      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }

      const event = stripe.webhooks.constructEvent(
        params.payload,
        params.signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          return {
            success: true,
            eventType: event.type,
            data: {
              transactionId: session.id,
              paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
              status: session.payment_status === 'paid' ? 'completed' : 'pending',
              amount: session.amount_total || undefined,
              currency: session.currency?.toUpperCase() as TSupportedCurrency,
              customerEmail: session.customer_email || undefined,
              metadata: (session.metadata as Record<string, string>) || {}
            }
          };
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return {
            success: true,
            eventType: event.type,
            data: {
              paymentIntentId: paymentIntent.id,
              status: 'completed',
              amount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase() as TSupportedCurrency,
              metadata: (paymentIntent.metadata as Record<string, string>) || {}
            }
          };
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return {
            success: true,
            eventType: event.type,
            data: {
              paymentIntentId: paymentIntent.id,
              status: 'failed',
              amount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase() as TSupportedCurrency,
              metadata: (paymentIntent.metadata as Record<string, string>) || {}
            }
          };
        }

        case 'transfer.created': {
          const transfer = event.data.object as Stripe.Transfer;
          return {
            success: true,
            eventType: event.type,
            data: {
              payoutId: transfer.id,
              status: 'pending',
              amount: transfer.amount,
              currency: transfer.currency.toUpperCase() as TSupportedCurrency,
              connectedAccountId: transfer.destination as string
            }
          };
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          return {
            success: true,
            eventType: event.type,
            data: {
              transactionId: charge.id,
              paymentIntentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : undefined,
              status: 'refunded',
              amount: charge.amount_refunded,
              currency: charge.currency.toUpperCase() as TSupportedCurrency
            }
          };
        }

        default:
          return {
            success: true,
            eventType: event.type,
            data: { status: 'pending' }
          };
      }
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      };
    }
  }

  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<CreateConnectedAccountResult> {
    try {
      const stripe = this.getStripe();

      const account = await stripe.accounts.create({
        type: params.type || 'express',
        email: params.email,
        country: params.country || 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_profile: {
          name: params.businessName
        }
      });

      return {
        success: true,
        accountId: account.id,
        accountData: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted
        }
      };
    } catch (error) {
      console.error('Stripe createConnectedAccount error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create connected account'
      };
    }
  }

  async getAccountLink(params: GetAccountLinkParams): Promise<GetAccountLinkResult> {
    try {
      const stripe = this.getStripe();

      const accountLink = await stripe.accountLinks.create({
        account: params.accountId,
        return_url: params.returnUrl,
        refresh_url: params.refreshUrl,
        type: 'account_onboarding'
      });

      return {
        success: true,
        url: accountLink.url
      };
    } catch (error) {
      console.error('Stripe getAccountLink error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account link'
      };
    }
  }

  async getAccountStatus(params: GetAccountStatusParams): Promise<AccountStatusResult> {
    try {
      const stripe = this.getStripe();

      const account = await stripe.accounts.retrieve(params.accountId);

      return {
        success: true,
        isActive: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      };
    } catch (error) {
      console.error('Stripe getAccountStatus error:', error);
      return {
        success: false,
        isActive: false,
        error: error instanceof Error ? error.message : 'Failed to get account status'
      };
    }
  }

  async createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult> {
    try {
      const stripe = this.getStripe();

      // Create a transfer to the connected account
      const transfer = await stripe.transfers.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        destination: params.accountId,
        description: params.reason,
        metadata: {
          reference: params.reference || ''
        }
      });

      return {
        success: true,
        payoutId: transfer.id,
        status: 'pending'
      };
    } catch (error) {
      console.error('Stripe createPayout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payout'
      };
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    try {
      const stripe = this.getStripe();

      const refundParams: Stripe.RefundCreateParams = {
        reason: params.reason as Stripe.RefundCreateParams.Reason
      };

      if (params.paymentIntentId) {
        refundParams.payment_intent = params.paymentIntentId;
      }

      if (params.amount) {
        refundParams.amount = params.amount;
      }

      const refund = await stripe.refunds.create(refundParams);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('Stripe refundPayment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund payment'
      };
    }
  }
}

export const stripeProvider = new StripeProvider();
