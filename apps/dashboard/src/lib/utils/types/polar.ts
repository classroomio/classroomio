interface BillingAddress {
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string;
}

interface Customer {
  createdAt: string;
  modifiedAt: string | null;
  id: string;
  metadata: Record<string, any>;
  email: string;
  emailVerified: boolean;
  name: string;
  billingAddress: BillingAddress;
  taxId: string | null;
  organizationId: string;
  avatarUrl: string;
}

interface User {
  id: string;
  email: string;
  publicName: string;
  avatarUrl: string | null;
  githubUsername: string | null;
}

interface Price {
  createdAt: string;
  modifiedAt: string | null;
  id: string;
  amountType: string;
  isArchived: boolean;
  productId: string;
  priceCurrency: string;
  priceAmount: number;
  type: string;
  recurringInterval: string;
}

interface Media {
  id: string;
  organizationId: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  storageVersion: string;
  checksumEtag: string;
  checksumSha256Base64: string;
  checksumSha256Hex: string;
  lastModifiedAt: string;
  version: string | null;
  service: string;
  isUploaded: boolean;
  createdAt: string;
  sizeReadable: string;
  publicUrl: string;
}

interface Product {
  createdAt: string;
  modifiedAt: string;
  id: string;
  name: string;
  description: string;
  isRecurring: boolean;
  isArchived: boolean;
  organizationId: string;
  metadata: Record<string, any>;
  prices: Price[];
  benefits: any[];
  medias: Media[];
  attachedCustomFields: any[];
}

interface SubscriptionData {
  createdAt: string;
  modifiedAt: string | null;
  id: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  startedAt: string;
  endsAt: string | null;
  endedAt: string | null;
  customerId: string;
  productId: string;
  priceId: string;
  discountId: string | null;
  checkoutId: string;
  customerCancellationReason: string | null;
  customerCancellationComment: string | null;
  metadata: {
    orgId: string;
    orgSlug: string;
    triggeredBy: string;
  };
  customFieldData: Record<string, any>;
  customer: Customer;
  userId: string;
  user: User;
  product: Product;
  price: Price;
  discount: any | null;
}

export interface PolarWebhookPayload {
  type: string;
  data: SubscriptionData;
}
