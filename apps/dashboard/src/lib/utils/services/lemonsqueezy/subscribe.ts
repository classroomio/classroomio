import { getAccessToken } from '$lib/utils/functions/supabase';
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
  const accessToken = await getAccessToken();

  const response = await axios({
    method: 'POST',
    url: '/api/lmz/subscribe',
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.data;
}
