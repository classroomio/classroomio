type PackageJson = {
    name?: unknown;
    dependencies?: {
        [key in string]?: unknown;
    };
    devDependencies?: {
        [key in string]?: unknown;
    };
    filePath: string;
};
export declare function getPackageJson(startPath?: string): PackageJson | null;
export {};
