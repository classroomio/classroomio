import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  GetObjectLockConfigurationOutput,
  GetObjectLockConfigurationRequest,
} from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface GetObjectLockConfigurationCommandInput
  extends GetObjectLockConfigurationRequest {}
export interface GetObjectLockConfigurationCommandOutput
  extends GetObjectLockConfigurationOutput,
    __MetadataBearer {}
export declare class GetObjectLockConfigurationCommand extends $Command<
  GetObjectLockConfigurationCommandInput,
  GetObjectLockConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: GetObjectLockConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: GetObjectLockConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    GetObjectLockConfigurationCommandInput,
    GetObjectLockConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
