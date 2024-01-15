import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { PutObjectAclOutput, PutObjectAclRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutObjectAclCommandInput extends PutObjectAclRequest {}
export interface PutObjectAclCommandOutput
  extends PutObjectAclOutput,
    __MetadataBearer {}
export declare class PutObjectAclCommand extends $Command<
  PutObjectAclCommandInput,
  PutObjectAclCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutObjectAclCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutObjectAclCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutObjectAclCommandInput, PutObjectAclCommandOutput>;
  private serialize;
  private deserialize;
}
