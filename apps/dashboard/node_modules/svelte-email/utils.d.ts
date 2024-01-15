export declare const copyTextToClipboard: (text: string) => Promise<void>;
export declare const pxToPt: (px: string) => number | null;
export interface Margin {
    m?: string;
    mx?: string;
    my?: string;
    mt?: string;
    mr?: string;
    mb?: string;
    ml?: string;
}
export declare const withMargin: (props: Margin) => {};
export declare const styleToString: (style: Record<string, string | number | null>) => string;
export declare const unreachable: (condition: never, message?: string) => never;
