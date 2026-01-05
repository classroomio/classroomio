import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import {
  ZInitiatePayment,
  ZVerifyPayment,
  ZCreatePayoutAccount,
  ZStripeConnectLink,
  ZPaystackBankList,
  ZPayoutAccountStatus,
  ZPaymentTransactionQuery,
  ZPaymentProvider
} from '@cio/utils/validation/payment';
import {
  initiatePayment,
  verifyPayment,
  handlePaymentWebhook,
  createOrgPayoutAccount,
  getStripeAccountLink,
  getPayoutAccountStatus,
  getOrgPayoutAccounts,
  getOrgEarningsSummary,
  getOrgTransactions,
  getCourseTransactions,
  getOrgPayouts,
  paystackProvider
} from '@api/services/payment';
import { z } from 'zod';

export const paymentRouter = new Hono()
  // ==================== PUBLIC ROUTES (for checkout) ====================

  /**
   * POST /payment/checkout
   * Initiate a payment checkout session
   * Public route - used from course landing pages
   */
  .post('/checkout', zValidator('json', ZInitiatePayment), async (c) => {
    try {
      const body = c.req.valid('json');
      const result = await initiatePayment(body);

      return c.json(
        {
          success: true,
          data: {
            checkoutUrl: result.checkoutUrl,
            reference: result.reference,
            transactionId: result.transaction.id
          }
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to initiate payment');
    }
  })

  /**
   * POST /payment/verify
   * Verify a payment after redirect from provider
   * Public route - called from success redirect page
   */
  .post('/verify', zValidator('json', ZVerifyPayment), async (c) => {
    try {
      const body = c.req.valid('json');
      const transaction = await verifyPayment(body.transactionId, body.providerReference);

      return c.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      return handleError(c, error, 'Failed to verify payment');
    }
  })

  // ==================== WEBHOOK ROUTES ====================

  /**
   * POST /payment/webhook/stripe
   * Handle Stripe webhooks
   */
  .post('/webhook/stripe', async (c) => {
    try {
      const signature = c.req.header('stripe-signature');
      if (!signature) {
        return c.json({ success: false, error: 'Missing signature' }, 400);
      }

      const payload = await c.req.text();
      const result = await handlePaymentWebhook('stripe', payload, signature);

      if (!result.success) {
        return c.json({ success: false, error: result.error }, 400);
      }

      return c.json({ success: true, received: true });
    } catch (error) {
      return handleError(c, error, 'Failed to process Stripe webhook');
    }
  })

  /**
   * POST /payment/webhook/paystack
   * Handle Paystack webhooks
   */
  .post('/webhook/paystack', async (c) => {
    try {
      const signature = c.req.header('x-paystack-signature');
      if (!signature) {
        return c.json({ success: false, error: 'Missing signature' }, 400);
      }

      const payload = await c.req.text();
      const result = await handlePaymentWebhook('paystack', payload, signature);

      if (!result.success) {
        return c.json({ success: false, error: result.error }, 400);
      }

      return c.json({ success: true, received: true });
    } catch (error) {
      return handleError(c, error, 'Failed to process Paystack webhook');
    }
  })

  // ==================== PAYSTACK UTILITIES (PUBLIC) ====================

  /**
   * GET /payment/paystack/banks
   * Get list of Nigerian banks for Paystack subaccount creation
   */
  .get('/paystack/banks', async (c) => {
    try {
      const result = await paystackProvider.getBankList('nigeria');
      return c.json({
        success: true,
        data: result.banks
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch bank list');
    }
  })

  /**
   * POST /payment/paystack/verify-account
   * Verify a bank account before creating subaccount
   */
  .post(
    '/paystack/verify-account',
    zValidator('json', z.object({ accountNumber: z.string(), bankCode: z.string() })),
    async (c) => {
      try {
        const { accountNumber, bankCode } = c.req.valid('json');
        const result = await paystackProvider.verifyBankAccount(accountNumber, bankCode);

        if (!result.success) {
          return c.json({ success: false, error: result.error }, 400);
        }

        return c.json({
          success: true,
          data: { accountName: result.accountName }
        });
      } catch (error) {
        return handleError(c, error, 'Failed to verify bank account');
      }
    }
  )

  // ==================== AUTHENTICATED ROUTES ====================

  /**
   * POST /payment/payout-account
   * Create a payout account for an organization
   * Requires org admin role
   */
  .post('/payout-account', authMiddleware, zValidator('json', ZCreatePayoutAccount), async (c) => {
    try {
      const body = c.req.valid('json');
      const account = await createOrgPayoutAccount(body);

      return c.json(
        {
          success: true,
          data: account
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create payout account');
    }
  })

  /**
   * POST /payment/stripe/account-link
   * Get Stripe Connect account onboarding link
   */
  .post('/stripe/account-link', authMiddleware, zValidator('json', ZStripeConnectLink), async (c) => {
    try {
      const body = c.req.valid('json');

      // First, get or create the Stripe payout account
      const accounts = await getOrgPayoutAccounts(body.organizationId);
      const stripeAccount = accounts.find((a) => a.provider === 'stripe');

      if (!stripeAccount) {
        return c.json({ success: false, error: 'Stripe payout account not found' }, 404);
      }

      const result = await getStripeAccountLink(stripeAccount.id, body.returnUrl, body.refreshUrl);

      return c.json({
        success: true,
        data: { url: result.url }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to create Stripe account link');
    }
  })

  /**
   * GET /payment/payout-account/:accountId/status
   * Get payout account status from provider
   */
  .get('/payout-account/:accountId/status', authMiddleware, async (c) => {
    try {
      const accountId = c.req.param('accountId');
      const result = await getPayoutAccountStatus(accountId);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get payout account status');
    }
  })

  /**
   * GET /payment/organization/:orgId/payout-accounts
   * Get all payout accounts for an organization
   */
  .get('/organization/:orgId/payout-accounts', authMiddleware, async (c) => {
    try {
      const orgId = c.req.param('orgId');
      const accounts = await getOrgPayoutAccounts(orgId);

      return c.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get payout accounts');
    }
  })

  /**
   * GET /payment/organization/:orgId/earnings
   * Get earnings summary for an organization
   */
  .get('/organization/:orgId/earnings', authMiddleware, async (c) => {
    try {
      const orgId = c.req.param('orgId');
      const earnings = await getOrgEarningsSummary(orgId);

      return c.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get earnings summary');
    }
  })

  /**
   * GET /payment/organization/:orgId/transactions
   * Get payment transactions for an organization
   */
  .get('/organization/:orgId/transactions', authMiddleware, zValidator('query', ZPaymentTransactionQuery), async (c) => {
    try {
      const orgId = c.req.param('orgId');
      const query = c.req.valid('query');
      const result = await getOrgTransactions(orgId, query);

      return c.json({
        success: true,
        data: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get transactions');
    }
  })

  /**
   * GET /payment/course/:courseId/transactions
   * Get payment transactions for a course
   */
  .get('/course/:courseId/transactions', authMiddleware, zValidator('query', ZPaymentTransactionQuery), async (c) => {
    try {
      const courseId = c.req.param('courseId');
      const query = c.req.valid('query');
      const result = await getCourseTransactions(courseId, query);

      return c.json({
        success: true,
        data: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get course transactions');
    }
  })

  /**
   * GET /payment/organization/:orgId/payouts
   * Get payouts for an organization
   */
  .get('/organization/:orgId/payouts', authMiddleware, async (c) => {
    try {
      const orgId = c.req.param('orgId');
      const result = await getOrgPayouts(orgId);

      return c.json({
        success: true,
        data: result.payouts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get payouts');
    }
  });
