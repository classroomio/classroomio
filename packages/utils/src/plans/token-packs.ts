export const TOKEN_PACK = {
  TOKENS_PER_UNIT: 5_000_000,
  PRICE_USD_CENTS: 500,
  CURRENCY: 'USD'
} as const;

export type TokenPackMetadata = {
  kind: 'token_pack';
  orgId: string;
  orgSlug: string;
  triggeredBy: string;
  tokensPerUnit: number;
};
