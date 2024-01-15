import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  StreamingBlobPayloadInputTypes,
} from "@smithy/types";
import { UploadPartOutput, UploadPartRequest } from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface UploadPartCommandInput
  extends Pick<UploadPartRequest, Exclude<keyof UploadPartRequest, "Body">> {
  Body?: StreamingBlobPayloadInputTypes;
}
export interface UploadPartCommandOutput
  extends UploadPartOutput,
    __MetadataBearer {}
export declare class UploadPartCommand extends $Command<
  UploadPartCommandInput,
  UploadPartCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: UploadPartCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: UploadPartCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<UploadPartCommandInput, UploadPartCommandOutput>;
  private serialize;
  private deserialize;
}
