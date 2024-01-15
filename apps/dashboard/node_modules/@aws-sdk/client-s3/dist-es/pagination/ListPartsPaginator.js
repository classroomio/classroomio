import { ListPartsCommand } from "../commands/ListPartsCommand";
import { S3Client } from "../S3Client";
const makePagedClientRequest = async (client, input, ...args) => {
    return await client.send(new ListPartsCommand(input), ...args);
};
export async function* paginateListParts(config, input, ...additionalArguments) {
    let token = config.startingToken || undefined;
    let hasNext = true;
    let page;
    while (hasNext) {
        input.PartNumberMarker = token;
        input["MaxParts"] = config.pageSize;
        if (config.client instanceof S3Client) {
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
