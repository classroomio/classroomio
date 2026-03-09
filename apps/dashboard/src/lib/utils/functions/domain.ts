import { orgApi } from '$features/org/api/org.svelte';

export const sanitizeDomain = (domain: string) => {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0];
};

export async function sendDomainRequest(
  key: 'verify_domain' | 'add_domain' | 'remove_domain',
  domain: string
): Promise<{ success: boolean; data?: unknown; verified?: boolean; message?: string }> {
  const response = await orgApi.sendDomainRequest(key, domain);

  if (orgApi.success && response) {
    const data = 'data' in response ? response.data : null;
    const verified = 'verified' in response ? response.verified : undefined;

    return {
      success: true,
      data,
      verified
    };
  }

  return {
    success: false,
    message: typeof orgApi.error === 'string' ? orgApi.error : 'Failed to process domain request'
  };
}
