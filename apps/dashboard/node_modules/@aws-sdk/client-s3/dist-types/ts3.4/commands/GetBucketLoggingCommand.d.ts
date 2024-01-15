import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketLoggingOutput,
  GetBucketLoggingRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketLoggingCommandInput extends GetBucketLoggingRequest {}
export interface GetBucketLoggingCommandOutput
  extends GetBucketLoggingOutput,
    __MetadataBearer {}
export declare class GetBucketLoggingCommand extends $Command<
  GetBucketLoggingCommandInput,
  GetBucketLoggingCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketLoggingCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketLoggingCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetBucketLoggingCommandInput, GetBucketLoggingCommandOutput>;
  private serialize;
  private deserialize;
}
