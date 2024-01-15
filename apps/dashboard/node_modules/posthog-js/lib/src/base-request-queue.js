var RequestQueueScaffold = /** @class */ (function () {
    function RequestQueueScaffold(pollInterval) {
        if (pollInterval === void 0) { pollInterval = 3000; }
        this.isPolling = true; // flag to continue to recursively poll or not
        this._event_queue = [];
        this._empty_queue_count = 0; // to track empty polls
        this._poller = undefined; // to become interval for reference to clear later
        this._pollInterval = pollInterval;
    }
    RequestQueueScaffold.prototype.setPollInterval = function (interval) {
        this._pollInterval = interval;
        // Reset interval if running already
        if (this.isPolling) {
            this.poll();
        }
    };
    // // eslint-disable-next-line no-unused-vars
    // enqueue(_requestData: Record<string, any>): void {
    //     return
    // }
    RequestQueueScaffold.prototype.poll = function () {
        return;
    };
    RequestQueueScaffold.prototype.unload = function () {
        return;
    };
    RequestQueueScaffold.prototype.getTime = function () {
        return new Date().getTime();
    };
    return RequestQueueScaffold;
}());
export { RequestQueueScaffold };
//# sourceMappingURL=base-request-queue.js.map