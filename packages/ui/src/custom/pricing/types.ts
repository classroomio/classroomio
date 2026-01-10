export interface PlanPrice {
  CURRENCY: string;
  MONTHLY: string;
  YEARLY: string;
  IS_PREMIUM: boolean;
}

export interface PlanCTA {
  LABEL: string;
  LINK: string;
  DASHBOARD_LABEL: string;
  DASHBOARD_LINK: string;
  IS_DISABLED: boolean;
  PRODUCT_ID?: string;
  PRODUCT_ID_YEARLY?: string;
}

export interface Plan {
  NAME: string;
  DESCRIPTION: string;
  PRICE: PlanPrice;
  FEATURES: string[];
  CTA: PlanCTA;
}

export type Plans = Record<string, Plan>;
