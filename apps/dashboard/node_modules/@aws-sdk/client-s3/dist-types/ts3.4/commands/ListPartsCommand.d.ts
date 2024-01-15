import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { ListPartsOutput, ListPartsRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface ListPartsCommandInput extends ListPartsRequest {}
export interface ListPartsCommandOutput
  extends ListPartsOutput,
    __MetadataBearer {}
export declare class ListPartsCommand extends $Command<
  ListPartsCommandInput,
  ListPartsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: ListPartsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: ListPartsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<ListPartsCommandInput, ListPartsCommandOutput>;
  private serialize;
  private deserialize;
}
