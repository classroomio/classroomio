import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetBucketRequestPaymentOutput,
  GetBucketRequestPaymentRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetBucketRequestPaymentCommandInput
  extends GetBucketRequestPaymentRequest {}
export interface GetBucketRequestPaymentCommandOutput
  extends GetBucketRequestPaymentOutput,
    __MetadataBearer {}
export declare class GetBucketRequestPaymentCommand extends $Command<
  GetBucketRequestPaymentCommandInput,
  GetBucketRequestPaymentCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetBucketRequestPaymentCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetBucketRequestPaymentCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetBucketRequestPaymentCommandInput,
    GetBucketRequestPaymentCommandOutput
  >;
  private serialize;
  private deserialize;
}
