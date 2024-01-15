import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  ListObjectVersionsOutput,
  ListObjectVersionsRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListObjectVersionsCommandInput
  extends ListObjectVersionsRequest {}
export interface ListObjectVersionsCommandOutput
  extends ListObjectVersionsOutput,
    __MetadataBearer {}
export declare class ListObjectVersionsCommand extends $Command<
  ListObjectVersionsCommandInput,
  ListObjectVersionsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListObjectVersionsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListObjectVersionsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<ListObjectVersionsCommandInput, ListObjectVersionsCommandOutput>;
  private serialize;
  private deserialize;
}
