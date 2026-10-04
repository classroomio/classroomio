export interface MachineProps {
  /** accessible description; omit to hide the drawing from assistive tech */
  label?: string;
  /** accent colour for the one moving part; defaults to --ui-primary */
  accent?: string;
  /** fill that hides lines behind faces; set to the surface colour behind the machine */
  face?: string;
  /** second to freeze on under prefers-reduced-motion */
  stillAt?: number;
  style?: React.CSSProperties;
}
/** @startingPoint section="Brand" subtitle="Isometric line machines: hero and pillar illustrations" viewport="700x340" */
export declare function MachineTrainingLine(props: MachineProps): JSX.Element;
export declare function MachineRepeater(props: MachineProps): JSX.Element;
export declare function MachineSpectrum(props: MachineProps): JSX.Element;
export declare function MachineCertificatePress(props: MachineProps): JSX.Element;
export declare function MachineBrandStand(props: MachineProps): JSX.Element;
export declare function MachineEventWire(props: MachineProps): JSX.Element;
export declare function MachineGlassBox(props: MachineProps): JSX.Element;
