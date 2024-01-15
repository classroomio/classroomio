import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  StreamingBlobPayloadInputTypes,
} from "@smithy/types";
import { PutObjectOutput, PutObjectRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutObjectCommandInput
  extends Pick<PutObjectRequest, Exclude<keyof PutObjectRequest, "Body">> {
  Body?: StreamingBlobPayloadInputTypes;
}
export interface PutObjectCommandOutput
  extends PutObjectOutput,
    __MetadataBearer {}
export declare class PutObjectCommand extends $Command<
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutObjectCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutObjectCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutObjectCommandInput, PutObjectCommandOutput>;
  private serialize;
  private deserialize;
}
