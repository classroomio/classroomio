export interface PlanData {
  NAME: string;
  DESCRIPTION?: string;
  PRICE: {
    CURRENCY: string;
    MONTHLY: string;
    YEARLY: string;
    IS_PREMIUM: boolean;
  };
  FEATURES: string[];
  CTA: {
    LABEL?: string;
    LINK?: string;
    DASHBOARD_LABEL: string;
    DASHBOARD_LINK?: string;
    IS_DISABLED: boolean;
    PRODUCT_ID?: string;
    PRODUCT_ID_YEARLY?: string;
  };
}
