import { BaseApiWithErrors, classroomio, type InferResponseType } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import type {
  TCreatePayoutAccount,
  TInitiatePayment,
  TPaymentTransactionQuery
} from '@cio/utils/validation/payment';
import { ZCreatePayoutAccount } from '@cio/utils/validation/payment';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

// Type definitions for payment API responses
type GetPayoutAccountsRequest = (typeof classroomio.payment.organization)[':orgId']['payout-accounts']['$get'];
type GetPayoutAccountsSuccess = Extract<InferResponseType<GetPayoutAccountsRequest>, { success: true }>;
export type PayoutAccounts = GetPayoutAccountsSuccess['data'];
export type PayoutAccount = PayoutAccounts[number];

type GetEarningsRequest = (typeof classroomio.payment.organization)[':orgId']['earnings']['$get'];
type GetEarningsSuccess = Extract<InferResponseType<GetEarningsRequest>, { success: true }>;
export type EarningsSummary = GetEarningsSuccess['data'];

type GetTransactionsRequest = (typeof classroomio.payment.organization)[':orgId']['transactions']['$get'];
type GetTransactionsSuccess = Extract<InferResponseType<GetTransactionsRequest>, { success: true }>;
export type PaymentTransactions = GetTransactionsSuccess['data'];
export type PaymentTransaction = PaymentTransactions[number];

type GetPaystackBanksRequest = typeof classroomio.payment.paystack.banks.$get;
type GetPaystackBanksSuccess = Extract<InferResponseType<GetPaystackBanksRequest>, { success: true }>;
export type PaystackBanks = GetPaystackBanksSuccess['data'];

/**
 * API class for payment and payout operations
 */
class PaymentApi extends BaseApiWithErrors {
  payoutAccounts = $state<PayoutAccounts>([]);
  earnings = $state<EarningsSummary | null>(null);
  transactions = $state<PaymentTransactions>([]);
  transactionsPagination = $state<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  paystackBanks = $state<PaystackBanks>([]);
  verifiedAccountName = $state<string | null>(null);

  // Loading states
  isFetchingPayoutAccounts = $state(false);
  isFetchingEarnings = $state(false);
  isFetchingTransactions = $state(false);
  isFetchingBanks = $state(false);
  isVerifyingAccount = $state(false);
  isCreatingAccount = $state(false);

  /**
   * Get all payout accounts for an organization
   */
  async getPayoutAccounts(orgId: string) {
    this.isFetchingPayoutAccounts = true;

    await this.execute<GetPayoutAccountsRequest>({
      requestFn: () =>
        classroomio.payment.organization[':orgId']['payout-accounts'].$get({
          param: { orgId }
        }),
      logContext: 'fetching payout accounts',
      onSuccess: (response) => {
        this.payoutAccounts = response.data;
      }
    });

    this.isFetchingPayoutAccounts = false;
  }

  /**
   * Get earnings summary for an organization
   */
  async getEarnings(orgId: string) {
    this.isFetchingEarnings = true;

    await this.execute<GetEarningsRequest>({
      requestFn: () =>
        classroomio.payment.organization[':orgId'].earnings.$get({
          param: { orgId }
        }),
      logContext: 'fetching earnings summary',
      onSuccess: (response) => {
        this.earnings = response.data;
      }
    });

    this.isFetchingEarnings = false;
  }

  /**
   * Get payment transactions for an organization
   */
  async getTransactions(orgId: string, query: TPaymentTransactionQuery = {}) {
    this.isFetchingTransactions = true;

    await this.execute<GetTransactionsRequest>({
      requestFn: () =>
        classroomio.payment.organization[':orgId'].transactions.$get({
          param: { orgId },
          query: {
            page: query.page?.toString() || '1',
            limit: query.limit?.toString() || '20',
            status: query.status
          }
        }),
      logContext: 'fetching transactions',
      onSuccess: (response) => {
        this.transactions = response.data;
        if ('pagination' in response) {
          this.transactionsPagination = response.pagination as {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      }
    });

    this.isFetchingTransactions = false;
  }

  /**
   * Get Nigerian banks for Paystack subaccount creation
   */
  async getPaystackBanks() {
    this.isFetchingBanks = true;

    await this.execute<GetPaystackBanksRequest>({
      requestFn: () => classroomio.payment.paystack.banks.$get(),
      logContext: 'fetching Nigerian banks',
      onSuccess: (response) => {
        this.paystackBanks = response.data;
      }
    });

    this.isFetchingBanks = false;
  }

  /**
   * Verify a Nigerian bank account
   */
  async verifyPaystackAccount(accountNumber: string, bankCode: string) {
    this.isVerifyingAccount = true;
    this.verifiedAccountName = null;

    await this.execute<typeof classroomio.payment.paystack['verify-account']['$post']>({
      requestFn: () =>
        classroomio.payment.paystack['verify-account'].$post({
          json: { accountNumber, bankCode }
        }),
      logContext: 'verifying bank account',
      onSuccess: (response) => {
        this.verifiedAccountName = response.data.accountName;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        } else if ('error' in result) {
          snackbar.error(result.error);
        }
      }
    });

    this.isVerifyingAccount = false;
    return this.verifiedAccountName;
  }

  /**
   * Create a payout account (Stripe Connect or Paystack Subaccount)
   */
  async createPayoutAccount(data: TCreatePayoutAccount) {
    const result = ZCreatePayoutAccount.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'payment');
      return null;
    }

    this.isCreatingAccount = true;

    let createdAccount: PayoutAccount | null = null;

    await this.execute<typeof classroomio.payment['payout-account']['$post']>({
      requestFn: () =>
        classroomio.payment['payout-account'].$post({
          json: result.data
        }),
      logContext: 'creating payout account',
      onSuccess: (response) => {
        createdAccount = response.data as PayoutAccount;
        this.payoutAccounts = [...this.payoutAccounts, createdAccount];
        snackbar.success('Payout account created successfully');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        } else if ('error' in result && 'field' in result) {
          this.errors[result.field as string] = result.error;
        } else if ('error' in result) {
          snackbar.error(result.error);
        }
      }
    });

    this.isCreatingAccount = false;
    return createdAccount;
  }

  /**
   * Get Stripe Connect account onboarding link
   */
  async getStripeAccountLink(organizationId: string, returnUrl: string, refreshUrl: string) {
    let url: string | null = null;

    await this.execute<typeof classroomio.payment.stripe['account-link']['$post']>({
      requestFn: () =>
        classroomio.payment.stripe['account-link'].$post({
          json: { organizationId, returnUrl, refreshUrl }
        }),
      logContext: 'getting Stripe account link',
      onSuccess: (response) => {
        url = response.data.url || null;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
        } else if ('error' in result) {
          snackbar.error(result.error);
        }
      }
    });

    return url;
  }

  /**
   * Get payout account status from provider
   */
  async getAccountStatus(accountId: string) {
    let status: { isActive: boolean; chargesEnabled?: boolean; payoutsEnabled?: boolean } | null = null;

    await this.execute<(typeof classroomio.payment)['payout-account'][':accountId']['status']['$get']>({
      requestFn: () =>
        classroomio.payment['payout-account'][':accountId'].status.$get({
          param: { accountId }
        }),
      logContext: 'getting account status',
      onSuccess: (response) => {
        const data = response.data;
        status = {
          isActive: data.providerStatus?.isActive ?? data.isActive,
          chargesEnabled: data.providerStatus?.chargesEnabled,
          payoutsEnabled: data.providerStatus?.payoutsEnabled
        };
      }
    });

    return status;
  }

  /**
   * Reset state
   */
  reset() {
    this.payoutAccounts = [];
    this.earnings = null;
    this.transactions = [];
    this.transactionsPagination = null;
    this.verifiedAccountName = null;
    this.errors = {};
  }
}

export const paymentApi = new PaymentApi();
