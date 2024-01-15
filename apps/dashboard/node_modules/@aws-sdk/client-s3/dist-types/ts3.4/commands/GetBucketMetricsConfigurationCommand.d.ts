import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketMetricsConfigurationOutput,
  GetBucketMetricsConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketMetricsConfigurationCommandInput
  extends GetBucketMetricsConfigurationRequest {}
export interface GetBucketMetricsConfigurationCommandOutput
  extends GetBucketMetricsConfigurationOutput,
    __MetadataBearer {}
export declare class GetBucketMetricsConfigurationCommand extends $Command<
  GetBucketMetricsConfigurationCommandInput,
  GetBucketMetricsConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketMetricsConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketMetricsConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketMetricsConfigurationCommandInput,
    GetBucketMetricsConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
