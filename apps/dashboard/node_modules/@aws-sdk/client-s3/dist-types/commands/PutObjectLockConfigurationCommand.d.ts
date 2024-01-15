import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@smithy/types";
import { PutObjectLockConfigurationOutput, PutObjectLockConfigurationRequest } from "../models/models_1";
import { S3ClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../S3Client";
/**
 * @public
 */
export { __MetadataBearer, $Command };
/**
 * @public
 *
 * The input for {@link PutObjectLockConfigurationCommand}.
 */
export interface PutObjectLockConfigurationCommandInput extends PutObjectLockConfigurationRequest {
}
/**
 * @public
 *
 * The output of {@link PutObjectLockConfigurationCommand}.
 */
export interface PutObjectLockConfigurationCommandOutput extends PutObjectLockConfigurationOutput, __MetadataBearer {
}
/**
 * @public
 * <p>Places an Object Lock configuration on the specified bucket. The rule specified in the
 *          Object Lock configuration will be applied by default to every new object placed in the
 *          specified bucket. For more information, see <a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lock.html">Locking Objects</a>. </p>
 *          <note>
 *             <ul>
 *                <li>
 *                   <p>The <code>DefaultRetention</code> settings require both a mode and a
 *                   period.</p>
 *                </li>
 *                <li>
 *                   <p>The <code>DefaultRetention</code> period can be either <code>Days</code> or
 *                      <code>Years</code> but you must select one. You cannot specify
 *                      <code>Days</code> and <code>Years</code> at the same time.</p>
 *                </li>
 *                <li>
 *                   <p>You can only enable Object Lock for new buckets. If you want to turn on Object
 *                   Lock for an existing bucket, contact Amazon Web Services Support.</p>
 *                </li>
 *             </ul>
 *          </note>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { S3Client, PutObjectLockConfigurationCommand } from "@aws-sdk/client-s3"; // ES Modules import
 * // const { S3Client, PutObjectLockConfigurationCommand } = require("@aws-sdk/client-s3"); // CommonJS import
 * const client = new S3Client(config);
 * const input = { // PutObjectLockConfigurationRequest
 *   Bucket: "STRING_VALUE", // required
 *   ObjectLockConfiguration: { // ObjectLockConfiguration
 *     ObjectLockEnabled: "Enabled",
 *     Rule: { // ObjectLockRule
 *       DefaultRetention: { // DefaultRetention
 *         Mode: "GOVERNANCE" || "COMPLIANCE",
 *         Days: Number("int"),
 *         Years: Number("int"),
 *       },
 *     },
 *   },
 *   RequestPayer: "requester",
 *   Token: "STRING_VALUE",
 *   ContentMD5: "STRING_VALUE",
 *   ChecksumAlgorithm: "CRC32" || "CRC32C" || "SHA1" || "SHA256",
 *   ExpectedBucketOwner: "STRING_VALUE",
 * };
 * const command = new PutObjectLockConfigurationCommand(input);
 * const response = await client.send(command);
 * // { // PutObjectLockConfigurationOutput
 * //   RequestCharged: "requester",
 * // };
 *
 * ```
 *
 * @param PutObjectLockConfigurationCommandInput - {@link PutObjectLockConfigurationCommandInput}
 * @returns {@link PutObjectLockConfigurationCommandOutput}
 * @see {@link PutObjectLockConfigurationCommandInput} for command's `input` shape.
 * @see {@link PutObjectLockConfigurationCommandOutput} for command's `response` shape.
 * @see {@link S3ClientResolvedConfig | config} for S3Client's `config` shape.
 *
 * @throws {@link S3ServiceException}
 * <p>Base exception class for all service exceptions from S3 service.</p>
 *
 */
export declare class PutObjectLockConfigurationCommand extends $Command<PutObjectLockConfigurationCommandInput, PutObjectLockConfigurationCommandOutput, S3ClientResolvedConfig> {
    readonly input: PutObjectLockConfigurationCommandInput;
    static getEndpointParameterInstructions(): EndpointParameterInstructions;
    /**
     * @public
     */
    constructor(input: PutObjectLockConfigurationCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: S3ClientResolvedConfig, options?: __HttpHandlerOptions): Handler<PutObjectLockConfigurationCommandInput, PutObjectLockConfigurationCommandOutput>;
    /**
     * @internal
     */
    private serialize;
    /**
     * @internal
     */
    private deserialize;
}
