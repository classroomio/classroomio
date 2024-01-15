import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { ListObjectsOutput, ListObjectsRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListObjectsCommandInput extends ListObjectsRequest {}
export interface ListObjectsCommandOutput
  extends ListObjectsOutput,
    __MetadataBearer {}
export declare class ListObjectsCommand extends $Command<
  ListObjectsCommandInput,
  ListObjectsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListObjectsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListObjectsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<ListObjectsCommandInput, ListObjectsCommandOutput>;
  private serialize;
  private deserialize;
}
