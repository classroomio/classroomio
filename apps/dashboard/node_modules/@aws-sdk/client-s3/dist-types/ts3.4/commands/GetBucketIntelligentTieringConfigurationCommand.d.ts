import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketIntelligentTieringConfigurationOutput,
  GetBucketIntelligentTieringConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketIntelligentTieringConfigurationCommandInput
  extends GetBucketIntelligentTieringConfigurationRequest {}
export interface GetBucketIntelligentTieringConfigurationCommandOutput
  extends GetBucketIntelligentTieringConfigurationOutput,
    __MetadataBearer {}
export declare class GetBucketIntelligentTieringConfigurationCommand extends $Command<
  GetBucketIntelligentTieringConfigurationCommandInput,
  GetBucketIntelligentTieringConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketIntelligentTieringConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketIntelligentTieringConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketIntelligentTieringConfigurationCommandInput,
    GetBucketIntelligentTieringConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
