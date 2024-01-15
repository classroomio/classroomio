import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  PutObjectRetentionOutput,
  PutObjectRetentionRequest,
} from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutObjectRetentionCommandInput
  extends PutObjectRetentionRequest {}
export interface PutObjectRetentionCommandOutput
  extends PutObjectRetentionOutput,
    __MetadataBearer {}
export declare class PutObjectRetentionCommand extends $Command<
  PutObjectRetentionCommandInput,
  PutObjectRetentionCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutObjectRetentionCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutObjectRetentionCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutObjectRetentionCommandInput, PutObjectRetentionCommandOutput>;
  private serialize;
  private deserialize;
}
