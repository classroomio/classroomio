export interface NotchCardProps {
  children?: React.ReactNode;
  background?: string;
  /** colour of the surface behind the card — paints the notch */
  pageColor?: string;
  notchLeft?: number;
  /** add the downward tab that interlocks with the next card's notch */
  tab?: boolean;
  padding?: string | number; as?: string; href?: string; style?: React.CSSProperties;
}
/** @startingPoint section="Surfaces" subtitle="Sand card with the signature notch" viewport="700x300" */
export declare function NotchCard(props: NotchCardProps): JSX.Element;