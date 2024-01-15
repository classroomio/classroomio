import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@smithy/types";
import { DeleteBucketCorsRequest } from "../models/models_0";
import { S3ClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../S3Client";
/**
 * @public
 */
export { __MetadataBearer, $Command };
/**
 * @public
 *
 * The input for {@link DeleteBucketCorsCommand}.
 */
export interface DeleteBucketCorsCommandInput extends DeleteBucketCorsRequest {
}
/**
 * @public
 *
 * The output of {@link DeleteBucketCorsCommand}.
 */
export interface DeleteBucketCorsCommandOutput extends __MetadataBearer {
}
/**
 * @public
 * <p>Deletes the <code>cors</code> configuration information set for the bucket.</p>
 *          <p>To use this operation, you must have permission to perform the
 *             <code>s3:PutBucketCORS</code> action. The bucket owner has this permission by default
 *          and can grant this permission to others. </p>
 *          <p>For information about <code>cors</code>, see <a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html">Enabling Cross-Origin Resource Sharing</a> in
 *          the <i>Amazon S3 User Guide</i>.</p>
 *          <p class="title">
 *             <b>Related Resources</b>
 *          </p>
 *          <ul>
 *             <li>
 *                <p>
 *                   <a href="https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketCors.html">PutBucketCors</a>
 *                </p>
 *             </li>
 *             <li>
 *                <p>
 *                   <a href="https://docs.aws.amazon.com/AmazonS3/latest/API/RESTOPTIONSobject.html">RESTOPTIONSobject</a>
 *                </p>
 *             </li>
 *          </ul>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { S3Client, DeleteBucketCorsCommand } from "@aws-sdk/client-s3"; // ES Modules import
 * // const { S3Client, DeleteBucketCorsCommand } = require("@aws-sdk/client-s3"); // CommonJS import
 * const client = new S3Client(config);
 * const input = { // DeleteBucketCorsRequest
 *   Bucket: "STRING_VALUE", // required
 *   ExpectedBucketOwner: "STRING_VALUE",
 * };
 * const command = new DeleteBucketCorsCommand(input);
 * const response = await client.send(command);
 * // {};
 *
 * ```
 *
 * @param DeleteBucketCorsCommandInput - {@link DeleteBucketCorsCommandInput}
 * @returns {@link DeleteBucketCorsCommandOutput}
 * @see {@link DeleteBucketCorsCommandInput} for command's `input` shape.
 * @see {@link DeleteBucketCorsCommandOutput} for command's `response` shape.
 * @see {@link S3ClientResolvedConfig | config} for S3Client's `config` shape.
 *
 * @throws {@link S3ServiceException}
 * <p>Base exception class for all service exceptions from S3 service.</p>
 *
 * @example To delete cors configuration on a bucket.
 * ```javascript
 * // The following example deletes CORS configuration on a bucket.
 * const input = {
 *   "Bucket": "examplebucket"
 * };
 * const command = new DeleteBucketCorsCommand(input);
 * await client.send(command);
 * // example id: to-delete-cors-configuration-on-a-bucket-1483042856112
 * ```
 *
 */
export declare class DeleteBucketCorsCommand extends $Command<DeleteBucketCorsCommandInput, DeleteBucketCorsCommandOutput, S3ClientResolvedConfig> {
    readonly input: DeleteBucketCorsCommandInput;
    static getEndpointParameterInstructions(): EndpointParameterInstructions;
    /**
     * @public
     */
    constructor(input: DeleteBucketCorsCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: S3ClientResolvedConfig, options?: __HttpHandlerOptions): Handler<DeleteBucketCorsCommandInput, DeleteBucketCorsCommandOutput>;
    /**
     * @internal
     */
    private serialize;
    /**
     * @internal
     */
    private deserialize;
}
