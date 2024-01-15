import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketWebsiteOutput,
  GetBucketWebsiteRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketWebsiteCommandInput extends GetBucketWebsiteRequest {}
export interface GetBucketWebsiteCommandOutput
  extends GetBucketWebsiteOutput,
    __MetadataBearer {}
export declare class GetBucketWebsiteCommand extends $Command<
  GetBucketWebsiteCommandInput,
  GetBucketWebsiteCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketWebsiteCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketWebsiteCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetBucketWebsiteCommandInput, GetBucketWebsiteCommandOutput>;
  private serialize;
  private deserialize;
}
