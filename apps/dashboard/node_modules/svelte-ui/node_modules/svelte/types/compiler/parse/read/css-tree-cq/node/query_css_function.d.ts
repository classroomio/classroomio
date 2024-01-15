export declare const name = "QueryCSSFunction";
export declare const structure: {
    name: StringConstructor;
    expression: StringConstructor;
};
export declare function parse(): {
    type: string;
    loc: any;
    name: any;
    expression: any;
};
export declare function generate(node: any): void;
