import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketReplicationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketReplicationCommandInput
  extends PutBucketReplicationRequest {}
export interface PutBucketReplicationCommandOutput extends __MetadataBearer {}
export declare class PutBucketReplicationCommand extends $Command<
  PutBucketReplicationCommandInput,
  PutBucketReplicationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketReplicationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketReplicationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketReplicationCommandInput,
    PutBucketReplicationCommandOutput
  >;
  private serialize;
  private deserialize;
}
