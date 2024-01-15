import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { CopyObjectOutput, CopyObjectRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface CopyObjectCommandInput extends CopyObjectRequest {}
export interface CopyObjectCommandOutput
  extends CopyObjectOutput,
    __MetadataBearer {}
export declare class CopyObjectCommand extends $Command<
  CopyObjectCommandInput,
  CopyObjectCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: CopyObjectCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: CopyObjectCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<CopyObjectCommandInput, CopyObjectCommandOutput>;
  private serialize;
  private deserialize;
}
