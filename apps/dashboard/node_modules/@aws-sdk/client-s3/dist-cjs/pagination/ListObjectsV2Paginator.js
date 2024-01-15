"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateListObjectsV2 = void 0;
const ListObjectsV2Command_1 = require("../commands/ListObjectsV2Command");
const S3Client_1 = require("../S3Client");
const makePagedClientRequest = async (client, input, ...args) => {
    return await client.send(new ListObjectsV2Command_1.ListObjectsV2Command(input), ...args);
};
async function* paginateListObjectsV2(config, input, ...additionalArguments) {
    let token = config.startingToken || undefined;
    let hasNext = true;
    let page;
    while (hasNext) {
        input.ContinuationToken = token;
        input["MaxKeys"] = config.pageSize;
        if (config.client instanceof S3Client_1.S3Client) {
            page = await makePagedClientRequest(config.client, input, ...additionalArguments);
        }
        else {
            throw new Error("Invalid client, expected S3 | S3Client");
        }
        yield page;
        const prevToken = token;
        token = page.NextContinuationToken;
        hasNext = !!(token && (!config.stopOnSameToken || token !== prevToken));
    }
    return undefined;
}
exports.paginateListObjectsV2 = paginateListObjectsV2;
