export declare const name = "QueryFeatureRange";
export declare const structure: {
    name: StringConstructor;
    value: string[];
};
export declare function parse(): {
    type: string;
    loc: any;
    children: any;
};
export declare function generate(node: any): void;
