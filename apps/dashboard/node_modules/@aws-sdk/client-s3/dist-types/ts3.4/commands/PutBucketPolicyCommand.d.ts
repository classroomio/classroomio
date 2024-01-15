import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketPolicyRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketPolicyCommandInput extends PutBucketPolicyRequest {}
export interface PutBucketPolicyCommandOutput extends __MetadataBearer {}
export declare class PutBucketPolicyCommand extends $Command<
  PutBucketPolicyCommandInput,
  PutBucketPolicyCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketPolicyCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketPolicyCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutBucketPolicyCommandInput, PutBucketPolicyCommandOutput>;
  private serialize;
  private deserialize;
}
