export interface PricingToggleProps {
  /** controlled; omit to use defaultYearly */
  isYearly?: boolean;
  defaultYearly?: boolean;
  onToggle?: (isYearly: boolean) => void;
  monthlyLabel?: string;
  yearlyLabel?: string;
  /** floating discount badge; pass an empty string to hide */
  saveLabel?: string;
  style?: React.CSSProperties;
}
/** @startingPoint section="Forms" subtitle="Monthly / annual billing switch" viewport="400x120" */
export declare function PricingToggle(props: PricingToggleProps): JSX.Element;
