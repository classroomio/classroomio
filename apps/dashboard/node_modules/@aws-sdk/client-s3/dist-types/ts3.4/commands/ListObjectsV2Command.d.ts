import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { ListObjectsV2Output, ListObjectsV2Request } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListObjectsV2CommandInput extends ListObjectsV2Request {}
export interface ListObjectsV2CommandOutput
  extends ListObjectsV2Output,
    __MetadataBearer {}
export declare class ListObjectsV2Command extends $Command<
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListObjectsV2CommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListObjectsV2CommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>;
  private serialize;
  private deserialize;
}
