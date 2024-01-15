import fs from 'graceful-fs';

declare const existsSync: typeof fs.existsSync;
declare function findPagesDirectory(): string;
declare const PAGES_DIR: string;

export { PAGES_DIR, existsSync, findPagesDirectory };
