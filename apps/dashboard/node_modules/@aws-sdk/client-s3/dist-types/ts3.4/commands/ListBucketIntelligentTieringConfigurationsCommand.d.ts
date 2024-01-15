import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  ListBucketIntelligentTieringConfigurationsOutput,
  ListBucketIntelligentTieringConfigurationsRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListBucketIntelligentTieringConfigurationsCommandInput
  extends ListBucketIntelligentTieringConfigurationsRequest {}
export interface ListBucketIntelligentTieringConfigurationsCommandOutput
  extends ListBucketIntelligentTieringConfigurationsOutput,
    __MetadataBearer {}
export declare class ListBucketIntelligentTieringConfigurationsCommand extends $Command<
  ListBucketIntelligentTieringConfigurationsCommandInput,
  ListBucketIntelligentTieringConfigurationsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListBucketIntelligentTieringConfigurationsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListBucketIntelligentTieringConfigurationsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    ListBucketIntelligentTieringConfigurationsCommandInput,
    ListBucketIntelligentTieringConfigurationsCommandOutput
  >;
  private serialize;
  private deserialize;
}
