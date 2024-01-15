import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketInventoryConfigurationOutput,
  GetBucketInventoryConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketInventoryConfigurationCommandInput
  extends GetBucketInventoryConfigurationRequest {}
export interface GetBucketInventoryConfigurationCommandOutput
  extends GetBucketInventoryConfigurationOutput,
    __MetadataBearer {}
export declare class GetBucketInventoryConfigurationCommand extends $Command<
  GetBucketInventoryConfigurationCommandInput,
  GetBucketInventoryConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketInventoryConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketInventoryConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketInventoryConfigurationCommandInput,
    GetBucketInventoryConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
