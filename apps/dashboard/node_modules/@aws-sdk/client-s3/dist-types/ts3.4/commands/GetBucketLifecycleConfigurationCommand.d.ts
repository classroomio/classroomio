import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketLifecycleConfigurationOutput,
  GetBucketLifecycleConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketLifecycleConfigurationCommandInput
  extends GetBucketLifecycleConfigurationRequest {}
export interface GetBucketLifecycleConfigurationCommandOutput
  extends GetBucketLifecycleConfigurationOutput,
    __MetadataBearer {}
export declare class GetBucketLifecycleConfigurationCommand extends $Command<
  GetBucketLifecycleConfigurationCommandInput,
  GetBucketLifecycleConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketLifecycleConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketLifecycleConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketLifecycleConfigurationCommandInput,
    GetBucketLifecycleConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
