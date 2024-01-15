import { ListObjectsV2Command, } from "../commands/ListObjectsV2Command";
import { S3Client } from "../S3Client";
const makePagedClientRequest = async (client, input, ...args) => {
    return await client.send(new ListObjectsV2Command(input), ...args);
};
export async function* paginateListObjectsV2(config, input, ...additionalArguments) {
    let token = config.startingToken || undefined;
    let hasNext = true;
    let page;
    while (hasNext) {
        input.ContinuationToken = token;
        input["MaxKeys"] = config.pageSize;
        if (config.client instanceof S3Client) {
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
