import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketIntelligentTieringConfigurationRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketIntelligentTieringConfigurationCommandInput
  extends PutBucketIntelligentTieringConfigurationRequest {}
export interface PutBucketIntelligentTieringConfigurationCommandOutput
  extends __MetadataBearer {}
export declare class PutBucketIntelligentTieringConfigurationCommand extends $Command<
  PutBucketIntelligentTieringConfigurationCommandInput,
  PutBucketIntelligentTieringConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketIntelligentTieringConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketIntelligentTieringConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketIntelligentTieringConfigurationCommandInput,
    PutBucketIntelligentTieringConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
