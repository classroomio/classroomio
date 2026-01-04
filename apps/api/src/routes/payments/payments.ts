/**
 * Payment API Routes
 *
 * Handles course payments, checkout sessions, and payment verification.
 */

import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError, AppError, ErrorCodes } from '@api/utils/errors';
import {
  ZCreateCheckout,
  ZVerifyPayment,
  ZCreatePaymentAccount,
  ZGetStripeOnboarding,
  ZCreatePayout,
  ZGetPaymentsQuery,
  ZGetPayoutsQuery
} from '@cio/utils/validation/payments';
import {
  createCourseCheckout,
  verifyPayment,
  getPaymentsForOrganization,
  getPaymentAccountsForOrganization,
  getPendingEarnings,
  toSmallestUnit
} from '@api/services/payments';
import {
  createPaymentAccount,
  createPayout,
  getPayoutsForOrganization,
  getPayoutWithItems,
  getStripeOnboardingLink
} from '@api/services/payments';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { eq } from 'drizzle-orm';

export const paymentsRouter = new Hono()
  /**
   * POST /payments/checkout
   * Create a checkout session for course purchase
   * Public endpoint - anyone can start checkout
   */
  .post('/checkout', zValidator('json', ZCreateCheckout), async (c) => {
    try {
      const body = c.req.valid('json');

      // Get course details
      const [course] = await db
        .select({
          id: schema.course.id,
          title: schema.course.title,
          description: schema.course.description,
          cost: schema.course.cost,
          currency: schema.course.currency,
          logo: schema.course.logo,
          groupId: schema.course.groupId
        })
        .from(schema.course)
        .where(eq(schema.course.id, body.courseId))
        .limit(1);

      if (!course) {
        throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
      }

      if (!course.cost || course.cost <= 0) {
        throw new AppError('This course is free', ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Get organization from group
      const [group] = await db
        .select({ organizationId: schema.group.organizationId })
        .from(schema.group)
        .where(eq(schema.group.id, course.groupId!))
        .limit(1);

      if (!group?.organizationId) {
        throw new AppError('Course organization not found', ErrorCodes.NOT_FOUND, 404);
      }

      // Get user ID if authenticated (optional)
      let profileId: string | undefined;
      try {
        const user = c.get('user');
        if (user?.id) {
          profileId = user.id;
        }
      } catch {
        // User not authenticated, continue without profileId
      }

      const result = await createCourseCheckout({
        courseId: course.id,
        courseName: course.title,
        courseDescription: course.description || undefined,
        courseImageUrl: course.logo || undefined,
        amount: toSmallestUnit(course.cost, course.currency),
        currency: course.currency,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        profileId,
        organizationId: group.organizationId,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl
      });

      return c.json({
        success: true,
        data: {
          checkoutUrl: result.checkoutUrl,
          sessionId: result.sessionId,
          paymentId: result.paymentId
        }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to create checkout session');
    }
  })

  /**
   * GET /payments/verify/:paymentId
   * Verify payment status
   */
  .get('/verify/:paymentId', zValidator('param', ZVerifyPayment), async (c) => {
    try {
      const { paymentId } = c.req.valid('param');
      const result = await verifyPayment(paymentId);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to verify payment');
    }
  })

  /**
   * GET /payments
   * Get payments for the organization (admin only)
   */
  .get('/', authMiddleware, orgAdminMiddleware, zValidator('query', ZGetPaymentsQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');
      const query = c.req.valid('query');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const payments = await getPaymentsForOrganization(orgId, query.status);

      return c.json({
        success: true,
        data: payments
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch payments');
    }
  })

  /**
   * GET /payments/accounts
   * Get payment accounts for the organization
   */
  .get('/accounts', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const accounts = await getPaymentAccountsForOrganization(orgId);

      return c.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch payment accounts');
    }
  })

  /**
   * POST /payments/accounts
   * Create a payment account (Stripe Connect / Paystack Subaccount)
   */
  .post('/accounts', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreatePaymentAccount), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');
      const body = c.req.valid('json');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const account = await createPaymentAccount({
        organizationId: orgId,
        ...body
      });

      return c.json({
        success: true,
        data: account
      }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create payment account');
    }
  })

  /**
   * POST /payments/accounts/stripe/onboarding
   * Get Stripe Connect onboarding link
   */
  .post(
    '/accounts/stripe/onboarding',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZGetStripeOnboarding),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id');
        const body = c.req.valid('json');

        if (!orgId) {
          throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
        }

        const onboardingUrl = await getStripeOnboardingLink(orgId, body.refreshUrl, body.returnUrl);

        return c.json({
          success: true,
          data: { onboardingUrl }
        });
      } catch (error) {
        return handleError(c, error, 'Failed to get Stripe onboarding link');
      }
    }
  )

  /**
   * GET /payments/earnings
   * Get pending earnings for the organization
   */
  .get('/earnings', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const earnings = await getPendingEarnings(orgId);

      return c.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch earnings');
    }
  })

  /**
   * GET /payments/payouts
   * Get payouts for the organization
   */
  .get('/payouts', authMiddleware, orgAdminMiddleware, zValidator('query', ZGetPayoutsQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');
      const query = c.req.valid('query');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const payouts = await getPayoutsForOrganization(orgId, query.status);

      return c.json({
        success: true,
        data: payouts
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch payouts');
    }
  })

  /**
   * GET /payments/payouts/:payoutId
   * Get a specific payout with items
   */
  .get('/payouts/:payoutId', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const payoutId = c.req.param('payoutId');
      const result = await getPayoutWithItems(payoutId);

      if (!result) {
        throw new AppError('Payout not found', ErrorCodes.NOT_FOUND, 404);
      }

      // Verify the payout belongs to the org
      const orgId = c.req.header('cio-org-id');
      if (result.payout.organizationId !== orgId) {
        throw new AppError('Payout not found', ErrorCodes.NOT_FOUND, 404);
      }

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch payout');
    }
  })

  /**
   * POST /payments/payouts
   * Create a payout to the creator
   */
  .post('/payouts', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreatePayout), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id');
      const body = c.req.valid('json');

      if (!orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const payout = await createPayout(orgId, body.currency, body.paymentIds);

      return c.json({
        success: true,
        data: payout
      }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create payout');
    }
  });
