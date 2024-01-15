import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  ListBucketAnalyticsConfigurationsOutput,
  ListBucketAnalyticsConfigurationsRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListBucketAnalyticsConfigurationsCommandInput
  extends ListBucketAnalyticsConfigurationsRequest {}
export interface ListBucketAnalyticsConfigurationsCommandOutput
  extends ListBucketAnalyticsConfigurationsOutput,
    __MetadataBearer {}
export declare class ListBucketAnalyticsConfigurationsCommand extends $Command<
  ListBucketAnalyticsConfigurationsCommandInput,
  ListBucketAnalyticsConfigurationsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListBucketAnalyticsConfigurationsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListBucketAnalyticsConfigurationsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    ListBucketAnalyticsConfigurationsCommandInput,
    ListBucketAnalyticsConfigurationsCommandOutput
  >;
  private serialize;
  private deserialize;
}
