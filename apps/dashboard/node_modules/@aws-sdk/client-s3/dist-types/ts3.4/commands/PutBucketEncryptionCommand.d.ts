import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketEncryptionRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketEncryptionCommandInput
  extends PutBucketEncryptionRequest {}
export interface PutBucketEncryptionCommandOutput extends __MetadataBearer {}
export declare class PutBucketEncryptionCommand extends $Command<
  PutBucketEncryptionCommandInput,
  PutBucketEncryptionCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketEncryptionCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketEncryptionCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutBucketEncryptionCommandInput, PutBucketEncryptionCommandOutput>;
  private serialize;
  private deserialize;
}
