import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketWebsiteRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketWebsiteCommandInput extends PutBucketWebsiteRequest {}
export interface PutBucketWebsiteCommandOutput extends __MetadataBearer {}
export declare class PutBucketWebsiteCommand extends $Command<
  PutBucketWebsiteCommandInput,
  PutBucketWebsiteCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketWebsiteCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketWebsiteCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutBucketWebsiteCommandInput, PutBucketWebsiteCommandOutput>;
  private serialize;
  private deserialize;
}
