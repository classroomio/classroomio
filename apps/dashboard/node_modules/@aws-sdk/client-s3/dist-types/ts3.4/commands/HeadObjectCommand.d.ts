import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { HeadObjectOutput, HeadObjectRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface HeadObjectCommandInput extends HeadObjectRequest {}
export interface HeadObjectCommandOutput
  extends HeadObjectOutput,
    __MetadataBearer {}
export declare class HeadObjectCommand extends $Command<
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: HeadObjectCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: HeadObjectCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<HeadObjectCommandInput, HeadObjectCommandOutput>;
  private serialize;
  private deserialize;
}
