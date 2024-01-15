import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketAccelerateConfigurationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketAccelerateConfigurationCommandInput
  extends PutBucketAccelerateConfigurationRequest {}
export interface PutBucketAccelerateConfigurationCommandOutput
  extends __MetadataBearer {}
export declare class PutBucketAccelerateConfigurationCommand extends $Command<
  PutBucketAccelerateConfigurationCommandInput,
  PutBucketAccelerateConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketAccelerateConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketAccelerateConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketAccelerateConfigurationCommandInput,
    PutBucketAccelerateConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
