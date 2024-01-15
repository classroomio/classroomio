import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketNotificationConfigurationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketNotificationConfigurationCommandInput
  extends PutBucketNotificationConfigurationRequest {}
export interface PutBucketNotificationConfigurationCommandOutput
  extends __MetadataBearer {}
export declare class PutBucketNotificationConfigurationCommand extends $Command<
  PutBucketNotificationConfigurationCommandInput,
  PutBucketNotificationConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketNotificationConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketNotificationConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketNotificationConfigurationCommandInput,
    PutBucketNotificationConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
