export declare class RequestQueueScaffold {
    isPolling: boolean;
    _event_queue: any[];
    _empty_queue_count: number;
    _poller: number | undefined;
    _pollInterval: number;
    constructor(pollInterval?: number);
    setPollInterval(interval: number): void;
    poll(): void;
    unload(): void;
    getTime(): number;
}
