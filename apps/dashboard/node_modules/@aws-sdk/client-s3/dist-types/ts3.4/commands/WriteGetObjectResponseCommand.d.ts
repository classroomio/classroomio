import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  StreamingBlobPayloadInputTypes,
} from "@smithy/types";
import { WriteGetObjectResponseRequest } from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface WriteGetObjectResponseCommandInput
  extends Pick<
    WriteGetObjectResponseRequest,
    Exclude<keyof WriteGetObjectResponseRequest, "Body">
  > {
  Body?: StreamingBlobPayloadInputTypes;
}
export interface WriteGetObjectResponseCommandOutput extends __MetadataBearer {}
export declare class WriteGetObjectResponseCommand extends $Command<
  WriteGetObjectResponseCommandInput,
  WriteGetObjectResponseCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: WriteGetObjectResponseCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: WriteGetObjectResponseCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    WriteGetObjectResponseCommandInput,
    WriteGetObjectResponseCommandOutput
  >;
  private serialize;
  private deserialize;
}
