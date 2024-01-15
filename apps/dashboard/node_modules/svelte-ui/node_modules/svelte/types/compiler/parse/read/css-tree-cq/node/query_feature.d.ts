export declare const name = "QueryFeature";
export declare const structure: {
    name: StringConstructor;
    value: string[];
};
export declare function parse(): {
    type: string;
    loc: any;
    name: any;
    value: any;
};
export declare function generate(node: any): void;
