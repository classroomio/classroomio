import type { DomainRequestData } from '$features/org/utils/types';
import { orgApi } from '$features/org/api/org.svelte';

export const sanitizeDomain = (domain: string) => {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/\.$/, '');
};

export async function sendDomainRequest(
  action: 'connect' | 'refresh' | 'remove',
  domain: string
): Promise<{ success: boolean; data?: DomainRequestData; message?: string }> {
  const response = await orgApi.sendDomainRequest(action, domain);

  if (orgApi.success && response?.data) {
    return {
      success: true,
      data: response.data
    };
  }

  return {
    success: false,
    message: typeof orgApi.error === 'string' ? orgApi.error : 'Failed to process domain request'
  };
}
