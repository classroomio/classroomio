/**
 * Payment API Client
 *
 * Handles course payments, payment accounts, and payouts.
 */

import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZCreateCheckout } from '@cio/utils/validation/payments';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  paymentId: string;
}

interface PaymentAccount {
  id: string;
  organizationId: string;
  provider: 'stripe' | 'paystack';
  providerAccountId: string;
  accountName: string | null;
  country: string;
  currency: string;
  isActive: boolean;
  isVerified: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string | null;
}

interface PendingEarnings {
  total: number;
  byCurrency: Record<string, number>;
  paymentCount: number;
}

interface CoursePayment {
  id: string;
  courseId: string;
  profileId: string;
  organizationId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paystack';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  customerEmail: string | null;
  customerName: string | null;
  platformFee: number;
  creatorAmount: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Payout {
  id: string;
  paymentAccountId: string;
  organizationId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paystack';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  providerPayoutId: string | null;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

class PaymentsApi extends BaseApiWithErrors {
  checkoutResult = $state<CheckoutResult | null>(null);
  paymentAccounts = $state<PaymentAccount[]>([]);
  payments = $state<CoursePayment[]>([]);
  payouts = $state<Payout[]>([]);
  pendingEarnings = $state<PendingEarnings | null>(null);

  /**
   * Create a checkout session for course purchase
   */
  async createCheckout(input: {
    courseId: string;
    customerEmail?: string;
    customerName?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult | null> {
    // Client-side validation
    const result = ZCreateCheckout.safeParse(input);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'payment');
      return null;
    }

    let checkoutResult: CheckoutResult | null = null;

    await this.execute<typeof classroomio.payments.checkout.$post>({
      requestFn: () =>
        classroomio.payments.checkout.$post({
          json: result.data
        }),
      logContext: 'creating checkout session',
      onSuccess: (response) => {
        if (response.data) {
          this.checkoutResult = response.data as CheckoutResult;
          checkoutResult = response.data as CheckoutResult;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          this.errors.general = result;
        } else if ('error' in result) {
          this.errors.general = result.error;
        }
      }
    });

    return checkoutResult;
  }

  /**
   * Verify a payment status
   */
  async verifyPayment(paymentId: string): Promise<{ success: boolean; status: string } | null> {
    let verificationResult: { success: boolean; status: string } | null = null;

    await this.execute<typeof classroomio.payments.verify[':paymentId']['$get']>({
      requestFn: () =>
        classroomio.payments.verify[':paymentId'].$get({
          param: { paymentId }
        }),
      logContext: 'verifying payment',
      onSuccess: (response) => {
        if (response.data) {
          verificationResult = response.data as { success: boolean; status: string };
        }
      }
    });

    return verificationResult;
  }

  /**
   * Get payment accounts for the organization
   */
  async getPaymentAccounts(): Promise<void> {
    await this.execute<typeof classroomio.payments.accounts.$get>({
      requestFn: () => classroomio.payments.accounts.$get(),
      logContext: 'fetching payment accounts',
      onSuccess: (response) => {
        if (response.data) {
          this.paymentAccounts = response.data as PaymentAccount[];
        }
      }
    });
  }

  /**
   * Create a payment account (Stripe Connect / Paystack Subaccount)
   */
  async createPaymentAccount(input: {
    accountName: string;
    email: string;
    country: string;
    currency: 'USD' | 'NGN';
    bankCode?: string;
    accountNumber?: string;
    businessName?: string;
    refreshUrl?: string;
    returnUrl?: string;
  }): Promise<PaymentAccount | null> {
    let account: PaymentAccount | null = null;

    await this.execute<typeof classroomio.payments.accounts.$post>({
      requestFn: () =>
        classroomio.payments.accounts.$post({
          json: input
        }),
      logContext: 'creating payment account',
      onSuccess: (response) => {
        if (response.data) {
          account = response.data as PaymentAccount;
          this.paymentAccounts = [...this.paymentAccounts, account];
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          this.errors.general = result;
        } else if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field as string] = result.error;
        } else if ('error' in result) {
          this.errors.general = result.error;
        }
      }
    });

    return account;
  }

  /**
   * Get Stripe Connect onboarding link
   */
  async getStripeOnboardingLink(refreshUrl: string, returnUrl: string): Promise<string | null> {
    let onboardingUrl: string | null = null;

    await this.execute<typeof classroomio.payments.accounts.stripe.onboarding.$post>({
      requestFn: () =>
        classroomio.payments.accounts.stripe.onboarding.$post({
          json: { refreshUrl, returnUrl }
        }),
      logContext: 'getting Stripe onboarding link',
      onSuccess: (response) => {
        if (response.data && 'onboardingUrl' in response.data) {
          onboardingUrl = (response.data as { onboardingUrl: string }).onboardingUrl;
        }
      }
    });

    return onboardingUrl;
  }

  /**
   * Get pending earnings
   */
  async getPendingEarnings(): Promise<void> {
    await this.execute<typeof classroomio.payments.earnings.$get>({
      requestFn: () => classroomio.payments.earnings.$get(),
      logContext: 'fetching pending earnings',
      onSuccess: (response) => {
        if (response.data) {
          this.pendingEarnings = response.data as PendingEarnings;
        }
      }
    });
  }

  /**
   * Get payments for the organization
   */
  async getPayments(status?: string): Promise<void> {
    await this.execute<typeof classroomio.payments.$get>({
      requestFn: () =>
        classroomio.payments.$get({
          query: status ? { status: status as 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled' } : {}
        }),
      logContext: 'fetching payments',
      onSuccess: (response) => {
        if (response.data) {
          this.payments = response.data as CoursePayment[];
        }
      }
    });
  }

  /**
   * Get payouts for the organization
   */
  async getPayouts(status?: string): Promise<void> {
    await this.execute<typeof classroomio.payments.payouts.$get>({
      requestFn: () =>
        classroomio.payments.payouts.$get({
          query: status ? { status: status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' } : {}
        }),
      logContext: 'fetching payouts',
      onSuccess: (response) => {
        if (response.data) {
          this.payouts = response.data as Payout[];
        }
      }
    });
  }

  /**
   * Create a payout
   */
  async createPayout(currency: 'USD' | 'NGN', paymentIds?: string[]): Promise<Payout | null> {
    let payout: Payout | null = null;

    await this.execute<typeof classroomio.payments.payouts.$post>({
      requestFn: () =>
        classroomio.payments.payouts.$post({
          json: { currency, paymentIds }
        }),
      logContext: 'creating payout',
      onSuccess: (response) => {
        if (response.data) {
          payout = response.data as Payout;
          this.payouts = [...this.payouts, payout];
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          this.errors.general = result;
        } else if ('error' in result) {
          this.errors.general = result.error;
        }
      }
    });

    return payout;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.checkoutResult = null;
    this.errors = {};
    this.isLoading = false;
  }
}

export const paymentsApi = new PaymentsApi();
