import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetObjectTaggingOutput,
  GetObjectTaggingRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetObjectTaggingCommandInput extends GetObjectTaggingRequest {}
export interface GetObjectTaggingCommandOutput
  extends GetObjectTaggingOutput,
    __MetadataBearer {}
export declare class GetObjectTaggingCommand extends $Command<
  GetObjectTaggingCommandInput,
  GetObjectTaggingCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetObjectTaggingCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetObjectTaggingCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetObjectTaggingCommandInput, GetObjectTaggingCommandOutput>;
  private serialize;
  private deserialize;
}
