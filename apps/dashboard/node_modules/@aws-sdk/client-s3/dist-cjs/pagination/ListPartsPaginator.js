"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateListParts = void 0;
const ListPartsCommand_1 = require("../commands/ListPartsCommand");
const S3Client_1 = require("../S3Client");
const makePagedClientRequest = async (client, input, ...args) => {
    return await client.send(new ListPartsCommand_1.ListPartsCommand(input), ...args);
};
async function* paginateListParts(config, input, ...additionalArguments) {
    let token = config.startingToken || undefined;
    let hasNext = true;
    let page;
    while (hasNext) {
        input.PartNumberMarker = token;
        input["MaxParts"] = config.pageSize;
        if (config.client instanceof S3Client_1.S3Client) {
            page = await makePagedClientRequest(config.client, input, ...additionalArguments);
        }
        else {
            throw new Error("Invalid client, expected S3 | S3Client");
        }
        yield page;
        const prevToken = token;
        token = page.NextPartNumberMarker;
        hasNext = !!(token && (!config.stopOnSameToken || token !== prevToken));
    }
    return undefined;
}
exports.paginateListParts = paginateListParts;
