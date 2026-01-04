/**
 * Stripe Payment Provider
 *
 * Implements the IPaymentProvider interface for Stripe payments.
 * Handles USD payments, Stripe Connect for creator accounts, and payouts.
 */

import Stripe from 'stripe';
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
import { PLATFORM_FEE_PERCENT, calculateCreatorAmount } from './types';
import type { TPaymentProvider } from '@cio/db/types';

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia'
    });
  }
  return stripeClient;
}

export class StripeProvider implements IPaymentProvider {
  readonly provider: TPaymentProvider = 'stripe';

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    const stripe = getStripeClient();

    // Calculate platform fee (application_fee_amount for Stripe Connect)
    const applicationFee = Math.round((input.amount * PLATFORM_FEE_PERCENT) / 100);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: {
              name: input.courseName,
              description: input.courseDescription,
              images: input.courseImageUrl ? [input.courseImageUrl] : undefined
            },
            unit_amount: input.amount
          },
          quantity: 1
        }
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        courseId: input.courseId,
        organizationId: input.organizationId,
        profileId: input.profileId || '',
        ...input.metadata
      }
    };

    // Add customer email if provided
    if (input.customerEmail) {
      sessionParams.customer_email = input.customerEmail;
    }

    // Note: For Stripe Connect with application fees, you would add:
    // payment_intent_data: {
    //   application_fee_amount: applicationFee,
    //   transfer_data: {
    //     destination: connectedAccountId
    //   }
    // }
    // This requires the connected account to be set up first

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
      provider: 'stripe'
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    const stripe = getStripeClient();

    // First try to retrieve as a checkout session
    try {
      const session = await stripe.checkout.sessions.retrieve(paymentId, {
        expand: ['payment_intent', 'customer']
      });

      if (session.payment_status === 'paid') {
        return {
          success: true,
          paymentId: (session.payment_intent as Stripe.PaymentIntent)?.id || session.id,
          status: 'succeeded',
          amount: session.amount_total || 0,
          currency: session.currency?.toUpperCase() || 'USD',
          customerEmail: session.customer_details?.email || undefined,
          customerName: session.customer_details?.name || undefined,
          metadata: session.metadata as Record<string, unknown>
        };
      }

      return {
        success: false,
        paymentId: session.id,
        status: session.payment_status === 'unpaid' ? 'pending' : 'failed',
        amount: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'USD',
        metadata: session.metadata as Record<string, unknown>
      };
    } catch {
      // If not a session, try payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

      const statusMap: Record<Stripe.PaymentIntent.Status, PaymentVerificationResult['status']> = {
        succeeded: 'succeeded',
        processing: 'pending',
        requires_payment_method: 'failed',
        requires_confirmation: 'pending',
        requires_action: 'pending',
        canceled: 'cancelled',
        requires_capture: 'pending'
      };

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        status: statusMap[paymentIntent.status] || 'pending',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        customerEmail: paymentIntent.receipt_email || undefined,
        metadata: paymentIntent.metadata as Record<string, unknown>
      };
    }
  }

  async createConnectedAccount(input: CreateConnectedAccountInput): Promise<ConnectedAccountResult> {
    const stripe = getStripeClient();

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: input.country,
      email: input.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        organizationId: input.organizationId,
        accountName: input.accountName
      }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: input.refreshUrl || `${process.env.DASHBOARD_URL}/settings/payments`,
      return_url: input.returnUrl || `${process.env.DASHBOARD_URL}/settings/payments?success=true`,
      type: 'account_onboarding'
    });

    return {
      accountId: account.id,
      provider: 'stripe',
      isVerified: account.details_submitted || false,
      onboardingUrl: accountLink.url,
      metadata: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      }
    };
  }

  async getAccountStatus(accountId: string): Promise<AccountStatusResult> {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(accountId);

    return {
      accountId: account.id,
      isActive: !account.deleted,
      isVerified: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirements: account.requirements?.currently_due || []
    };
  }

  async createPayout(input: CreatePayoutInput, destinationAccountId: string): Promise<PayoutResult> {
    const stripe = getStripeClient();

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      destination: destinationAccountId,
      description: input.description || `Payout for ${input.paymentIds.length} course sales`,
      metadata: {
        organizationId: input.organizationId,
        paymentAccountId: input.paymentAccountId,
        paymentIds: input.paymentIds.join(',')
      }
    });

    return {
      payoutId: transfer.id,
      status: 'processing', // Stripe transfers are typically instant but we mark as processing
      amount: transfer.amount,
      currency: transfer.currency.toUpperCase()
    };
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    const stripe = getStripeClient();

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: input.paymentId,
      reason: 'requested_by_customer'
    };

    if (input.amount) {
      refundParams.amount = input.amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      refundId: refund.id,
      status: refund.status === 'succeeded' ? 'succeeded' : refund.status === 'pending' ? 'pending' : 'failed',
      amount: refund.amount,
      currency: refund.currency.toUpperCase()
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookPayload> {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Map Stripe event types to our standard types
    const eventTypeMap: Record<string, WebhookPayload['event']> = {
      'checkout.session.completed': 'checkout.session.completed',
      'payment_intent.succeeded': 'payment_intent.succeeded',
      'payment_intent.payment_failed': 'payment_intent.payment_failed',
      'charge.refunded': 'charge.refunded',
      'account.updated': 'account.updated',
      'payout.paid': 'payout.paid',
      'payout.failed': 'payout.failed'
    };

    return {
      event: eventTypeMap[event.type] || (event.type as WebhookPayload['event']),
      provider: 'stripe',
      data: event.data.object as Record<string, unknown>,
      rawPayload: event
    };
  }

  getWebhookSignatureHeader(): string {
    return 'stripe-signature';
  }
}

// Export singleton instance
export const stripeProvider = new StripeProvider();
