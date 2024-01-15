import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeleteBucketAnalyticsConfigurationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteBucketAnalyticsConfigurationCommandInput
  extends DeleteBucketAnalyticsConfigurationRequest {}
export interface DeleteBucketAnalyticsConfigurationCommandOutput
  extends __MetadataBearer {}
export declare class DeleteBucketAnalyticsConfigurationCommand extends $Command<
  DeleteBucketAnalyticsConfigurationCommandInput,
  DeleteBucketAnalyticsConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteBucketAnalyticsConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteBucketAnalyticsConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    DeleteBucketAnalyticsConfigurationCommandInput,
    DeleteBucketAnalyticsConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
