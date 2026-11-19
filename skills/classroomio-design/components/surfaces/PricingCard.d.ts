export interface PlanData {
  NAME: string;
  DESCRIPTION?: string;
  PRICE: { CURRENCY: string; MONTHLY: string; YEARLY: string; IS_PREMIUM: boolean };
  FEATURES: string[];
  CTA: { LABEL?: string; LINK?: string; DASHBOARD_LABEL: string; DASHBOARD_LINK?: string; IS_DISABLED: boolean; PRODUCT_ID?: string; PRODUCT_ID_YEARLY?: string };
}
export interface PricingCardProps {
  plan: PlanData;
  /** gradient badge, primary CTA with sparkles icon */
  isPopular?: boolean;
  /** show PRICE.YEARLY instead of PRICE.MONTHLY */
  isYearlyPlan?: boolean;
  /** shows the CTA spinner when equal to planName */
  isLoadingPlan?: string | null;
  planName: string;
  onClick?: (plan: PlanData, planName: string) => void;
  popularLabel?: string;
  perOrgLabel?: string;
  /** defaults to plan.CTA.DASHBOARD_LABEL */
  ctaLabel?: string;
  /** defaults to plan.CTA.IS_DISABLED */
  isDisabled?: boolean;
  featuresLabel?: string;
  style?: React.CSSProperties;
}
/** @startingPoint section="Surfaces" subtitle="Plan card with price, CTA and feature list" viewport="420x520" */
export declare function PricingCard(props: PricingCardProps): JSX.Element;
