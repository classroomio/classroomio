import { Paginator } from "@smithy/types";
import {
  ListPartsCommandInput,
  ListPartsCommandOutput,
} from "../commands/ListPartsCommand";
import { S3PaginationConfiguration } from "./Interfaces";
export declare function paginateListParts(
  config: S3PaginationConfiguration,
  input: ListPartsCommandInput,
  ...additionalArguments: any
): Paginator<ListPartsCommandOutput>;
