import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  DeleteObjectTaggingOutput,
  DeleteObjectTaggingRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteObjectTaggingCommandInput
  extends DeleteObjectTaggingRequest {}
export interface DeleteObjectTaggingCommandOutput
  extends DeleteObjectTaggingOutput,
    __MetadataBearer {}
export declare class DeleteObjectTaggingCommand extends $Command<
  DeleteObjectTaggingCommandInput,
  DeleteObjectTaggingCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteObjectTaggingCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteObjectTaggingCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<DeleteObjectTaggingCommandInput, DeleteObjectTaggingCommandOutput>;
  private serialize;
  private deserialize;
}
