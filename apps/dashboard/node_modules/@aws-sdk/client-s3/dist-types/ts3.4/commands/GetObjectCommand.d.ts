import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  StreamingBlobPayloadOutputTypes,
} from "@smithy/types";
import { GetObjectOutput, GetObjectRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetObjectCommandInput extends GetObjectRequest {}
export interface GetObjectCommandOutput
  extends Pick<GetObjectOutput, Exclude<keyof GetObjectOutput, "Body">>,
    __MetadataBearer {
  Body?: StreamingBlobPayloadOutputTypes;
}
export declare class GetObjectCommand extends $Command<
  GetObjectCommandInput,
  GetObjectCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetObjectCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetObjectCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetObjectCommandInput, GetObjectCommandOutput>;
  private serialize;
  private deserialize;
}
