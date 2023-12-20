import generateApiKey from 'generate-api-key';
import type { ApiKeyResults } from 'generate-api-key';

export async function verifyApiKey(key: string): Promise<boolean> {
  return false;
}

export function generateKey(): ApiKeyResults {
  return generateApiKey({
    method: 'uuidv4',
    prefix: 'classIO',
    dashes: true
  });
}
