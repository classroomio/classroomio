import type { Integration } from '@sentry/types';
/** HttpContext integration collects information about HTTP request headers */
export declare class HttpContext implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * @inheritDoc
     */
    setupOnce(): void;
}
//# sourceMappingURL=httpcontext.d.ts.map