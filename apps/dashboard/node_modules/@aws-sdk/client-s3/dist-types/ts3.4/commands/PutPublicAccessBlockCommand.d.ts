import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutPublicAccessBlockRequest } from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutPublicAccessBlockCommandInput
  extends PutPublicAccessBlockRequest {}
export interface PutPublicAccessBlockCommandOutput extends __MetadataBearer {}
export declare class PutPublicAccessBlockCommand extends $Command<
  PutPublicAccessBlockCommandInput,
  PutPublicAccessBlockCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutPublicAccessBlockCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutPublicAccessBlockCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutPublicAccessBlockCommandInput,
    PutPublicAccessBlockCommandOutput
  >;
  private serialize;
  private deserialize;
}
