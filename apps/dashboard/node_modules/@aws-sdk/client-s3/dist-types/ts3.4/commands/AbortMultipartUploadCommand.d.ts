import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  AbortMultipartUploadOutput,
  AbortMultipartUploadRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface AbortMultipartUploadCommandInput
  extends AbortMultipartUploadRequest {}
export interface AbortMultipartUploadCommandOutput
  extends AbortMultipartUploadOutput,
    __MetadataBearer {}
export declare class AbortMultipartUploadCommand extends $Command<
  AbortMultipartUploadCommandInput,
  AbortMultipartUploadCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: AbortMultipartUploadCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: AbortMultipartUploadCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    AbortMultipartUploadCommandInput,
    AbortMultipartUploadCommandOutput
  >;
  private serialize;
  private deserialize;
}
