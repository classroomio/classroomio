export declare const name = "ContainerQuery";
export declare const structure: {
    name: string;
    children: string[][];
};
export declare function parse(): {
    type: string;
    loc: any;
    name: any;
    children: any;
};
export declare function generate(node: any): void;
