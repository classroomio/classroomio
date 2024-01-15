import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { RestoreObjectOutput, RestoreObjectRequest } from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface RestoreObjectCommandInput extends RestoreObjectRequest {}
export interface RestoreObjectCommandOutput
  extends RestoreObjectOutput,
    __MetadataBearer {}
export declare class RestoreObjectCommand extends $Command<
  RestoreObjectCommandInput,
  RestoreObjectCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: RestoreObjectCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: RestoreObjectCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<RestoreObjectCommandInput, RestoreObjectCommandOutput>;
  private serialize;
  private deserialize;
}
