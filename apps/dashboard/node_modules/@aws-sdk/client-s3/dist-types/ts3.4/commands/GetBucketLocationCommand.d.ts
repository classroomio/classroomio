import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketLocationOutput,
  GetBucketLocationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketLocationCommandInput
  extends GetBucketLocationRequest {}
export interface GetBucketLocationCommandOutput
  extends GetBucketLocationOutput,
    __MetadataBearer {}
export declare class GetBucketLocationCommand extends $Command<
  GetBucketLocationCommandInput,
  GetBucketLocationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketLocationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketLocationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetBucketLocationCommandInput, GetBucketLocationCommandOutput>;
  private serialize;
  private deserialize;
}
