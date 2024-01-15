import { Paginator } from "@smithy/types";
import { ListObjectsV2CommandInput, ListObjectsV2CommandOutput } from "../commands/ListObjectsV2Command";
import { S3PaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare function paginateListObjectsV2(config: S3PaginationConfiguration, input: ListObjectsV2CommandInput, ...additionalArguments: any): Paginator<ListObjectsV2CommandOutput>;
