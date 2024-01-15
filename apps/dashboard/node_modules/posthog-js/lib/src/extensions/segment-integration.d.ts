/**
 * Extend Segment with extra PostHog JS functionality. Required for things like Recordings and feature flags to work correctly.
 *
 * ### Usage
 *
 *  ```js
 *  // After your standard segment anyalytics install
 *  analytics.load("GOEDfA21zZTtR7clsBuDvmBKAtAdZ6Np");
 *
 *  analytics.ready(() => {
 *    posthog.init('<posthog-api-key>', {
 *      capture_pageview: false,
 *      segment: window.analytics, // NOTE: Be sure to use window.analytics here!
 *    });
 *    window.analytics.page();
 *  })
 *  ```
 */
import { PostHog } from '../posthog-core';
interface SegmentPluginContext {
    event: {
        event: string;
        userId?: string;
        anonymousId?: string;
        properties: any;
    };
}
interface SegmentPlugin {
    name: string;
    version: string;
    type: 'enrichment';
    isLoaded: () => boolean;
    load: (ctx: SegmentPluginContext, instance: any, config?: any) => Promise<unknown>;
    unload?: (ctx: SegmentPluginContext, instance: any) => Promise<unknown> | unknown;
    ready?: () => Promise<unknown>;
    track?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
    identify?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
    page?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
    group?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
    alias?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
    screen?: (ctx: SegmentPluginContext) => Promise<SegmentPluginContext> | SegmentPluginContext;
}
export declare const createSegmentIntegration: (posthog: PostHog) => SegmentPlugin;
export {};
