import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeletePublicAccessBlockRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeletePublicAccessBlockCommandInput
  extends DeletePublicAccessBlockRequest {}
export interface DeletePublicAccessBlockCommandOutput
  extends __MetadataBearer {}
export declare class DeletePublicAccessBlockCommand extends $Command<
  DeletePublicAccessBlockCommandInput,
  DeletePublicAccessBlockCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeletePublicAccessBlockCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeletePublicAccessBlockCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    DeletePublicAccessBlockCommandInput,
    DeletePublicAccessBlockCommandOutput
  >;
  private serialize;
  private deserialize;
}
