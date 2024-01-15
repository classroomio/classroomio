import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeleteBucketWebsiteRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteBucketWebsiteCommandInput
  extends DeleteBucketWebsiteRequest {}
export interface DeleteBucketWebsiteCommandOutput extends __MetadataBearer {}
export declare class DeleteBucketWebsiteCommand extends $Command<
  DeleteBucketWebsiteCommandInput,
  DeleteBucketWebsiteCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteBucketWebsiteCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteBucketWebsiteCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<DeleteBucketWebsiteCommandInput, DeleteBucketWebsiteCommandOutput>;
  private serialize;
  private deserialize;
}
