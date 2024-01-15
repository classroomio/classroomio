import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetPublicAccessBlockOutput,
  GetPublicAccessBlockRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetPublicAccessBlockCommandInput
  extends GetPublicAccessBlockRequest {}
export interface GetPublicAccessBlockCommandOutput
  extends GetPublicAccessBlockOutput,
    __MetadataBearer {}
export declare class GetPublicAccessBlockCommand extends $Command<
  GetPublicAccessBlockCommandInput,
  GetPublicAccessBlockCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetPublicAccessBlockCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetPublicAccessBlockCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetPublicAccessBlockCommandInput,
    GetPublicAccessBlockCommandOutput
  >;
  private serialize;
  private deserialize;
}
