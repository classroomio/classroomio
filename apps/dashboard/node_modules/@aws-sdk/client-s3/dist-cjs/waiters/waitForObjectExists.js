"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilObjectExists = exports.waitForObjectExists = void 0;
const util_waiter_1 = require("@smithy/util-waiter");
const HeadObjectCommand_1 = require("../commands/HeadObjectCommand");
const checkState = async (client, input) => {
    let reason;
    try {
        const result = await client.send(new HeadObjectCommand_1.HeadObjectCommand(input));
        reason = result;
        return { state: util_waiter_1.WaiterState.SUCCESS, reason };
    }
    catch (exception) {
        reason = exception;
        if (exception.name && exception.name == "NotFound") {
            return { state: util_waiter_1.WaiterState.RETRY, reason };
        }
    }
    return { state: util_waiter_1.WaiterState.RETRY, reason };
};
const waitForObjectExists = async (params, input) => {
    const serviceDefaults = { minDelay: 5, maxDelay: 120 };
    return (0, util_waiter_1.createWaiter)({ ...serviceDefaults, ...params }, input, checkState);
};
exports.waitForObjectExists = waitForObjectExists;
const waitUntilObjectExists = async (params, input) => {
    const serviceDefaults = { minDelay: 5, maxDelay: 120 };
    const result = await (0, util_waiter_1.createWaiter)({ ...serviceDefaults, ...params }, input, checkState);
    return (0, util_waiter_1.checkExceptions)(result);
};
exports.waitUntilObjectExists = waitUntilObjectExists;
