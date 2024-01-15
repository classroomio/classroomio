import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import {
  Handler,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
} from "@smithy/types";
import { DeleteBucketOwnershipControlsRequest } from "../models/models_0";
import {
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../S3Client";
export { __MetadataBearer, $Command };
export interface DeleteBucketOwnershipControlsCommandInput
  extends DeleteBucketOwnershipControlsRequest {}
export interface DeleteBucketOwnershipControlsCommandOutput
  extends __MetadataBearer {}
export declare class DeleteBucketOwnershipControlsCommand extends $Command<
  DeleteBucketOwnershipControlsCommandInput,
  DeleteBucketOwnershipControlsCommandOutput,
  S3ClientResolvedConfig
> {
  readonly input: DeleteBucketOwnershipControlsCommandInput;
  static getEndpointParameterInstructions(): EndpointParameterInstructions;
  constructor(input: DeleteBucketOwnershipControlsCommandInput);
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: S3ClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<
    DeleteBucketOwnershipControlsCommandInput,
    DeleteBucketOwnershipControlsCommandOutput
  >;
  private serialize;
  private deserialize;
}
