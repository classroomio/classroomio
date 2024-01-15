import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import {
  PutObjectLockConfigurationOutput,
  PutObjectLockConfigurationRequest,
} from "../models/models_1";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface PutObjectLockConfigurationCommandInput
  extends PutObjectLockConfigurationRequest {}
export interface PutObjectLockConfigurationCommandOutput
  extends PutObjectLockConfigurationOutput,
    __MetadataBearer {}
export declare class PutObjectLockConfigurationCommand extends $Command<
  PutObjectLockConfigurationCommandInput,
  PutObjectLockConfigurationCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: PutObjectLockConfigurationCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: PutObjectLockConfigurationCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    PutObjectLockConfigurationCommandInput,
    PutObjectLockConfigurationCommandOutput
  >;
  private serialize;
  private deserialize;
}
