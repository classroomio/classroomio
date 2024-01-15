import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { GetObjectAclOutput, GetObjectAclRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetObjectAclCommandInput extends GetObjectAclRequest {}
export interface GetObjectAclCommandOutput
  extends GetObjectAclOutput,
    __MetadataBearer {}
export declare class GetObjectAclCommand extends $Command<
  GetObjectAclCommandInput,
  GetObjectAclCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetObjectAclCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetObjectAclCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<GetObjectAclCommandInput, GetObjectAclCommandOutput>;
  private serialize;
  private deserialize;
}
