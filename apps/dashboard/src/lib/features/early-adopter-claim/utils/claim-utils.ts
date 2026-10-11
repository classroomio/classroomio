export const EARLY_ADOPTER_CLAIM_STORAGE_KEY = 'cio:early-adopter-claim';

const TERMINAL_ERROR_CODES: Record<string, string> = {
  EARLY_ADOPTER_CLAIM_INVALID: 'early_adopter_claim.errors.invalid',
  EARLY_ADOPTER_CLAIM_EXPIRED: 'early_adopter_claim.errors.expired',
  EARLY_ADOPTER_CLAIM_UNAVAILABLE: 'early_adopter_claim.errors.unavailable',
  EARLY_ADOPTER_PLAN_CONFLICT: 'early_adopter_claim.errors.conflict'
};

export function readStoredClaimToken(): string | null {
  try {
    return localStorage.getItem(EARLY_ADOPTER_CLAIM_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeClaimToken(token: string): void {
  try {
    localStorage.setItem(EARLY_ADOPTER_CLAIM_STORAGE_KEY, token);
  } catch (error) {
    console.error('saving early adopter claim token error:', error);
  }
}

export function clearStoredClaimToken(): void {
  try {
    localStorage.removeItem(EARLY_ADOPTER_CLAIM_STORAGE_KEY);
  } catch (error) {
    console.error('clearing early adopter claim token error:', error);
  }
}

/**
 * Translation key for a claim error that can never succeed on retry, or null when the failure may be temporary.
 */
export function getTerminalClaimErrorKey(code: string | undefined): string | null {
  return (code && TERMINAL_ERROR_CODES[code]) || null;
}
