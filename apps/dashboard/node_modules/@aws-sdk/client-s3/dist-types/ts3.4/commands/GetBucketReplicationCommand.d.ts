import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketReplicationOutput,
  GetBucketReplicationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketReplicationCommandInput
  extends GetBucketReplicationRequest {}
export interface GetBucketReplicationCommandOutput
  extends GetBucketReplicationOutput,
    __MetadataBearer {}
export declare class GetBucketReplicationCommand extends $Command<
  GetBucketReplicationCommandInput,
  GetBucketReplicationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketReplicationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketReplicationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketReplicationCommandInput,
    GetBucketReplicationCommandOutput
  >;
  private serialize;
  private deserialize;
}
