import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  StreamingBlobPayloadOutputTypes,
} from "@smithy/types";
import {
  GetObjectTorrentOutput,
  GetObjectTorrentRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetObjectTorrentCommandInput extends GetObjectTorrentRequest {}
export interface GetObjectTorrentCommandOutput
  extends Pick<
      GetObjectTorrentOutput,
      Exclude<keyof GetObjectTorrentOutput, "Body">
    >,
    __MetadataBearer {
  Body?: StreamingBlobPayloadOutputTypes;
}
export declare class GetObjectTorrentCommand extends $Command<
  GetObjectTorrentCommandInput,
  GetObjectTorrentCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetObjectTorrentCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetObjectTorrentCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetObjectTorrentCommandInput, GetObjectTorrentCommandOutput>;
  private serialize;
  private deserialize;
}
