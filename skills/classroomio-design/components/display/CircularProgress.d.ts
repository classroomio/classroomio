export interface CircularProgressProps {
  /** 0 to 100 */ value: number;
  /** px, default 20 */ size?: number;
  /** default 2 */ strokeWidth?: number;
  /** CSS colour for the arc, default var(--ui-primary) */ progressColor?: string;
  /** CSS colour for the track, default var(--ui-muted) */ trackColor?: string;
  style?: React.CSSProperties;
}
export declare function CircularProgress(props: CircularProgressProps): JSX.Element;
