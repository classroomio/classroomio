import type { Event as SentryEvent, Integration } from '@sentry/types';
/** JSDoc */
interface BreadcrumbsOptions {
    console: boolean;
    dom: boolean | {
        serializeAttribute?: string | string[];
        maxStringLength?: number;
    };
    fetch: boolean;
    history: boolean;
    sentry: boolean;
    xhr: boolean;
}
export declare const BREADCRUMB_INTEGRATION_ID = "Breadcrumbs";
/**
 * Default Breadcrumbs instrumentations
 * TODO: Deprecated - with v6, this will be renamed to `Instrument`
 */
export declare class Breadcrumbs implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * Options of the breadcrumbs integration.
     */
    readonly options: Readonly<BreadcrumbsOptions>;
    /**
     * @inheritDoc
     */
    constructor(options?: Partial<BreadcrumbsOptions>);
    /**
     * Instrument browser built-ins w/ breadcrumb capturing
     *  - Console API
     *  - DOM API (click/typing)
     *  - XMLHttpRequest API
     *  - Fetch API
     *  - History API
     */
    setupOnce(): void;
    /**
     * Adds a breadcrumb for Sentry events or transactions if this option is enabled.
     */
    addSentryBreadcrumb(event: SentryEvent): void;
}
export {};
//# sourceMappingURL=breadcrumbs.d.ts.map