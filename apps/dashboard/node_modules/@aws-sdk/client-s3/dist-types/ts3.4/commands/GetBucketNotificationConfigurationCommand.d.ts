import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketNotificationConfigurationRequest,
  NotificationConfiguration,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketNotificationConfigurationCommandInput
  extends GetBucketNotificationConfigurationRequest {}
export interface GetBucketNotificationConfigurationCommandOutput
  extends NotificationConfiguration,
    __MetadataBearer {}
export declare class GetBucketNotificationConfigurationCommand extends $Command<
  GetBucketNotificationConfigurationCommandInput,
  GetBucketNotificationConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketNotificationConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketNotificationConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketNotificationConfigurationCommandInput,
    GetBucketNotificationConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
