import { PostHog } from './posthog-core';
import { DecideResponse } from './types';
export declare class Decide {
    instance: PostHog;
    constructor(instance: PostHog);
    call(): void;
    parseDecideResponse(response: DecideResponse): void;
}
