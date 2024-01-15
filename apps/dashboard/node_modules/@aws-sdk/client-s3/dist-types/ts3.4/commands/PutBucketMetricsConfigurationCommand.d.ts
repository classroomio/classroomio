import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketMetricsConfigurationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketMetricsConfigurationCommandInput
  extends PutBucketMetricsConfigurationRequest {}
export interface PutBucketMetricsConfigurationCommandOutput
  extends __MetadataBearer {}
export declare class PutBucketMetricsConfigurationCommand extends $Command<
  PutBucketMetricsConfigurationCommandInput,
  PutBucketMetricsConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketMetricsConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketMetricsConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketMetricsConfigurationCommandInput,
    PutBucketMetricsConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
