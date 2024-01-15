import { Compiler } from 'webpack';

declare class NextraSearchPlugin {
    apply(compiler: Compiler): void;
}

export { NextraSearchPlugin };
