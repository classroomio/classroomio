import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketAnalyticsConfigurationOutput,
  GetBucketAnalyticsConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketAnalyticsConfigurationCommandInput
  extends GetBucketAnalyticsConfigurationRequest {}
export interface GetBucketAnalyticsConfigurationCommandOutput
  extends GetBucketAnalyticsConfigurationOutput,
    __MetadataBearer {}
export declare class GetBucketAnalyticsConfigurationCommand extends $Command<
  GetBucketAnalyticsConfigurationCommandInput,
  GetBucketAnalyticsConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketAnalyticsConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketAnalyticsConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketAnalyticsConfigurationCommandInput,
    GetBucketAnalyticsConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
