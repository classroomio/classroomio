import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  UploadPartCopyOutput,
  UploadPartCopyRequest,
} from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface UploadPartCopyCommandInput extends UploadPartCopyRequest {}
export interface UploadPartCopyCommandOutput
  extends UploadPartCopyOutput,
    __MetadataBearer {}
export declare class UploadPartCopyCommand extends $Command<
  UploadPartCopyCommandInput,
  UploadPartCopyCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: UploadPartCopyCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: UploadPartCopyCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<UploadPartCopyCommandInput, UploadPartCopyCommandOutput>;
  private serialize;
  private deserialize;
}
