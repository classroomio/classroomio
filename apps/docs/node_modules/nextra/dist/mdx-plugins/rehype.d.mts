declare const parseMeta: ({ defaultShowCopyCode }: {
    defaultShowCopyCode: any;
}) => (tree: any) => void;
declare const attachMeta: () => (tree: any) => void;

export { attachMeta, parseMeta };
