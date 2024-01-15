import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutBucketRequestPaymentRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutBucketRequestPaymentCommandInput
  extends PutBucketRequestPaymentRequest {}
export interface PutBucketRequestPaymentCommandOutput
  extends __MetadataBearer {}
export declare class PutBucketRequestPaymentCommand extends $Command<
  PutBucketRequestPaymentCommandInput,
  PutBucketRequestPaymentCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutBucketRequestPaymentCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutBucketRequestPaymentCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutBucketRequestPaymentCommandInput,
    PutBucketRequestPaymentCommandOutput
  >;
  private serialize;
  private deserialize;
}
