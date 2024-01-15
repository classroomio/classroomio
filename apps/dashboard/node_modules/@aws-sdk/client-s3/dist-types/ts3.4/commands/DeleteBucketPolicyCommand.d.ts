import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeleteBucketPolicyRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteBucketPolicyCommandInput
  extends DeleteBucketPolicyRequest {}
export interface DeleteBucketPolicyCommandOutput extends __MetadataBearer {}
export declare class DeleteBucketPolicyCommand extends $Command<
  DeleteBucketPolicyCommandInput,
  DeleteBucketPolicyCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteBucketPolicyCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteBucketPolicyCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<DeleteBucketPolicyCommandInput, DeleteBucketPolicyCommandOutput>;
  private serialize;
  private deserialize;
}
