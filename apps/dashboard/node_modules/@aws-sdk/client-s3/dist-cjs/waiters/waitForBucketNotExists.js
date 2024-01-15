"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilBucketNotExists = exports.waitForBucketNotExists = void 0;
const util_waiter_1 = require("@smithy/util-waiter");
const HeadBucketCommand_1 = require("../commands/HeadBucketCommand");
const checkState = async (client, input) => {
    let reason;
    try {
        const result = await client.send(new HeadBucketCommand_1.HeadBucketCommand(input));
        reason = result;
    }
    catch (exception) {
        reason = exception;
        if (exception.name && exception.name == "NotFound") {
            return { state: util_waiter_1.WaiterState.SUCCESS, reason };
        }
    }
    return { state: util_waiter_1.WaiterState.RETRY, reason };
};
const waitForBucketNotExists = async (params, input) => {
    const serviceDefaults = { minDelay: 5, maxDelay: 120 };
    return (0, util_waiter_1.createWaiter)({ ...serviceDefaults, ...params }, input, checkState);
};
exports.waitForBucketNotExists = waitForBucketNotExists;
const waitUntilBucketNotExists = async (params, input) => {
    const serviceDefaults = { minDelay: 5, maxDelay: 120 };
    const result = await (0, util_waiter_1.createWaiter)({ ...serviceDefaults, ...params }, input, checkState);
    return (0, util_waiter_1.checkExceptions)(result);
};
exports.waitUntilBucketNotExists = waitUntilBucketNotExists;
