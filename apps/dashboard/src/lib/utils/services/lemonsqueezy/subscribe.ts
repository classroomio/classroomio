import axios from 'axios';

interface SubscriptionData {
  productId: string;
  email: string;
  name: string;
  triggeredBy: string;
  orgId: string;
}

interface SubscriptionResponse {
  success: boolean;
  checkoutURL: string;
}

export async function subscribeToProduct(data: SubscriptionData): Promise<SubscriptionResponse> {
  const response = await axios({
    method: 'POST',
    url: '/api/lmz/subscribe',
    data
  });

  return response.data;
}
