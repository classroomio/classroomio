/**
 * Payment Webhook Routes
 *
 * Handles webhooks from Stripe and Paystack for payment events.
 */

import { Hono } from '@api/utils/hono';
import {
  stripeProvider,
  paystackProvider,
  handlePaymentSuccess,
  handlePaymentFailure
} from '@api/services/payments';
import { updatePaymentAccountStatus, handlePayoutStatusUpdate } from '@api/services/payments';
import type { TPaymentProvider } from '@cio/db/types';

export const webhooksRouter = new Hono()
  /**
   * POST /payments/webhooks/stripe
   * Handle Stripe webhooks
   */
  .post('/stripe', async (c) => {
    try {
      const signature = c.req.header('stripe-signature');

      if (!signature) {
        console.error('Missing Stripe signature header');
        return c.json({ error: 'Missing signature' }, 400);
      }

      // Get raw body for signature verification
      const rawBody = await c.req.text();

      let payload;
      try {
        payload = await stripeProvider.verifyWebhook(rawBody, signature);
      } catch (err) {
        console.error('Stripe webhook verification failed:', err);
        return c.json({ error: 'Invalid signature' }, 400);
      }

      console.log(`Processing Stripe webhook: ${payload.event}`);

      // Handle different event types
      switch (payload.event) {
        case 'checkout.session.completed': {
          const session = payload.data as Record<string, unknown>;
          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent as { id: string })?.id;

          await handlePaymentSuccess(
            paymentIntentId || (session.id as string),
            session.id as string,
            'stripe',
            (session.customer_details as Record<string, unknown>)?.email as string,
            (session.customer_details as Record<string, unknown>)?.name as string
          );
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = payload.data as Record<string, unknown>;
          await handlePaymentSuccess(
            paymentIntent.id as string,
            null,
            'stripe',
            paymentIntent.receipt_email as string
          );
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = payload.data as Record<string, unknown>;
          const lastError = paymentIntent.last_payment_error as Record<string, unknown>;
          await handlePaymentFailure(
            paymentIntent.id as string,
            null,
            'stripe',
            lastError?.message as string
          );
          break;
        }

        case 'account.updated': {
          const account = payload.data as Record<string, unknown>;
          await updatePaymentAccountStatus(account.id as string, 'stripe', {
            isVerified: account.details_submitted as boolean,
            isActive: !(account.deleted as boolean),
            metadata: {
              chargesEnabled: account.charges_enabled as boolean,
              payoutsEnabled: account.payouts_enabled as boolean,
              requirements: (account.requirements as Record<string, unknown>)?.currently_due
            }
          });
          break;
        }

        case 'payout.paid': {
          const transfer = payload.data as Record<string, unknown>;
          await handlePayoutStatusUpdate(transfer.id as string, 'stripe', 'completed');
          break;
        }

        case 'payout.failed': {
          const transfer = payload.data as Record<string, unknown>;
          await handlePayoutStatusUpdate(
            transfer.id as string,
            'stripe',
            'failed',
            (transfer.failure_message as string) || 'Payout failed'
          );
          break;
        }

        default:
          console.log(`Unhandled Stripe event: ${payload.event}`);
      }

      return c.json({ received: true });
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      // Return 200 to prevent Stripe from retrying
      return c.json({ received: true, error: 'Processing error' });
    }
  })

  /**
   * POST /payments/webhooks/paystack
   * Handle Paystack webhooks
   */
  .post('/paystack', async (c) => {
    try {
      const signature = c.req.header('x-paystack-signature');

      if (!signature) {
        console.error('Missing Paystack signature header');
        return c.json({ error: 'Missing signature' }, 400);
      }

      // Get raw body for signature verification
      const rawBody = await c.req.text();

      let payload;
      try {
        payload = await paystackProvider.verifyWebhook(rawBody, signature);
      } catch (err) {
        console.error('Paystack webhook verification failed:', err);
        return c.json({ error: 'Invalid signature' }, 400);
      }

      console.log(`Processing Paystack webhook: ${payload.event}`);

      // Handle different event types
      switch (payload.event) {
        case 'charge.success': {
          const data = payload.data as Record<string, unknown>;
          const customer = data.customer as Record<string, unknown>;
          await handlePaymentSuccess(
            data.reference as string,
            data.reference as string,
            'paystack',
            customer?.email as string,
            `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()
          );
          break;
        }

        case 'charge.failed': {
          const data = payload.data as Record<string, unknown>;
          await handlePaymentFailure(
            data.reference as string,
            data.reference as string,
            'paystack',
            data.gateway_response as string
          );
          break;
        }

        case 'transfer.success': {
          const data = payload.data as Record<string, unknown>;
          await handlePayoutStatusUpdate(data.transfer_code as string, 'paystack', 'completed');
          break;
        }

        case 'transfer.failed': {
          const data = payload.data as Record<string, unknown>;
          await handlePayoutStatusUpdate(
            data.transfer_code as string,
            'paystack',
            'failed',
            data.reason as string
          );
          break;
        }

        default:
          console.log(`Unhandled Paystack event: ${payload.event}`);
      }

      return c.json({ received: true });
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      // Return 200 to prevent Paystack from retrying
      return c.json({ received: true, error: 'Processing error' });
    }
  });
