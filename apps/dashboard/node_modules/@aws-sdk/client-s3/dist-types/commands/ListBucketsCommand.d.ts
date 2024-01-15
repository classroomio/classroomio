import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@smithy/types";
import { ListBucketsOutput } from "../models/models_0";
import { S3ClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../S3Client";
/**
 * @public
 */
export { __MetadataBearer, $Command };
/**
 * @public
 *
 * The input for {@link ListBucketsCommand}.
 */
export interface ListBucketsCommandInput {
}
/**
 * @public
 *
 * The output of {@link ListBucketsCommand}.
 */
export interface ListBucketsCommandOutput extends ListBucketsOutput, __MetadataBearer {
}
/**
 * @public
 * <p>Returns a list of all buckets owned by the authenticated sender of the request. To use
 *          this operation, you must have the <code>s3:ListAllMyBuckets</code> permission. </p>
 *          <p>For information about Amazon S3 buckets, see <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html">Creating, configuring, and
 *             working with Amazon S3 buckets</a>.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3"; // ES Modules import
 * // const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3"); // CommonJS import
 * const client = new S3Client(config);
 * const input = {};
 * const command = new ListBucketsCommand(input);
 * const response = await client.send(command);
 * // { // ListBucketsOutput
 * //   Buckets: [ // Buckets
 * //     { // Bucket
 * //       Name: "STRING_VALUE",
 * //       CreationDate: new Date("TIMESTAMP"),
 * //     },
 * //   ],
 * //   Owner: { // Owner
 * //     DisplayName: "STRING_VALUE",
 * //     ID: "STRING_VALUE",
 * //   },
 * // };
 *
 * ```
 *
 * @param ListBucketsCommandInput - {@link ListBucketsCommandInput}
 * @returns {@link ListBucketsCommandOutput}
 * @see {@link ListBucketsCommandInput} for command's `input` shape.
 * @see {@link ListBucketsCommandOutput} for command's `response` shape.
 * @see {@link S3ClientResolvedConfig | config} for S3Client's `config` shape.
 *
 * @throws {@link S3ServiceException}
 * <p>Base exception class for all service exceptions from S3 service.</p>
 *
 * @example To list all buckets
 * ```javascript
 * // The following example returns all the buckets owned by the sender of this request.
 * const input = undefined;
 * const command = new ListBucketsCommand(input);
 * const response = await client.send(command);
 * /* response ==
 * {
 *   "Buckets": [
 *     {
 *       "CreationDate": "2012-02-15T21:03:02.000Z",
 *       "Name": "examplebucket"
 *     },
 *     {
 *       "CreationDate": "2011-07-24T19:33:50.000Z",
 *       "Name": "examplebucket2"
 *     },
 *     {
 *       "CreationDate": "2010-12-17T00:56:49.000Z",
 *       "Name": "examplebucket3"
 *     }
 *   ],
 *   "Owner": {
 *     "DisplayName": "own-display-name",
 *     "ID": "examplee7a2f25102679df27bb0ae12b3f85be6f290b936c4393484be31"
 *   }
 * }
 * *\/
 * // example id: to-list-buckets-1481910996058
 * ```
 *
 */
export declare class ListBucketsCommand extends $Command<ListBucketsCommandInput, ListBucketsCommandOutput, S3ClientResolvedConfig> {
    readonly input: ListBucketsCommandInput;
    static getEndpointParameterInstructions(): EndpointParameterInstructions;
    /**
     * @public
     */
    constructor(input: ListBucketsCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: S3ClientResolvedConfig, options?: __HttpHandlerOptions): Handler<ListBucketsCommandInput, ListBucketsCommandOutput>;
    /**
     * @internal
     */
    private serialize;
    /**
     * @internal
     */
    private deserialize;
}
