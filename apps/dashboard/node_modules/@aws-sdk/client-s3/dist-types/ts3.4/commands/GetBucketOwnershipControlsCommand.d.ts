import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketOwnershipControlsOutput,
  GetBucketOwnershipControlsRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketOwnershipControlsCommandInput
  extends GetBucketOwnershipControlsRequest {}
export interface GetBucketOwnershipControlsCommandOutput
  extends GetBucketOwnershipControlsOutput,
    __MetadataBearer {}
export declare class GetBucketOwnershipControlsCommand extends $Command<
  GetBucketOwnershipControlsCommandInput,
  GetBucketOwnershipControlsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketOwnershipControlsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketOwnershipControlsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketOwnershipControlsCommandInput,
    GetBucketOwnershipControlsCommandOutput
  >;
  private serialize;
  private deserialize;
}
