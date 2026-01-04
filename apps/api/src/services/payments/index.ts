/**
 * Payment Services Index
 *
 * Re-exports all payment-related services and types.
 */

// Types
export * from './types';

// Providers
export { stripeProvider } from './stripe-provider';
export { paystackProvider, getNigerianBanks } from './paystack-provider';

// Services
export {
  getProviderForCurrency,
  getProviderByName,
  createCourseCheckout,
  handlePaymentSuccess,
  handlePaymentFailure,
  verifyPayment,
  getPaymentById,
  getPaymentsForCourse,
  getPaymentsForOrganization,
  getPaymentAccount,
  getPaymentAccountsForOrganization,
  getPendingEarnings
} from './payment-service';

export {
  createPaymentAccount,
  updatePaymentAccountStatus,
  getPendingPaymentsForPayout,
  createPayout,
  handlePayoutStatusUpdate,
  getPayoutsForOrganization,
  getPayoutWithItems,
  getStripeOnboardingLink
} from './payout-service';
