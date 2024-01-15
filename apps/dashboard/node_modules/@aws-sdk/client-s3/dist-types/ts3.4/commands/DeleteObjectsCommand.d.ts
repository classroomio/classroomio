import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeleteObjectsOutput, DeleteObjectsRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteObjectsCommandInput extends DeleteObjectsRequest {}
export interface DeleteObjectsCommandOutput
  extends DeleteObjectsOutput,
    __MetadataBearer {}
export declare class DeleteObjectsCommand extends $Command<
  DeleteObjectsCommandInput,
  DeleteObjectsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteObjectsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteObjectsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<DeleteObjectsCommandInput, DeleteObjectsCommandOutput>;
  private serialize;
  private deserialize;
}
