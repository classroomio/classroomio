import { EndpointParameterInstructions } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack, StreamingBlobPayloadOutputTypes } from "@smithy/types";
import { GetObjectTorrentOutput, GetObjectTorrentRequest } from "../models/models_0";
import { S3ClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../S3Client";
/**
 * @public
 */
export { __MetadataBearer, $Command };
/**
 * @public
 *
 * The input for {@link GetObjectTorrentCommand}.
 */
export interface GetObjectTorrentCommandInput extends GetObjectTorrentRequest {
}
/**
 * @public
 *
 * The output of {@link GetObjectTorrentCommand}.
 */
export interface GetObjectTorrentCommandOutput extends Omit<GetObjectTorrentOutput, "Body">, __MetadataBearer {
    Body?: StreamingBlobPayloadOutputTypes;
}
/**
 * @public
 * <p>Returns torrent files from a bucket. BitTorrent can save you bandwidth when you're
 *          distributing large files.</p>
 *          <note>
 *             <p>You can get torrent only for objects that are less than 5 GB in size, and that are
 *             not encrypted using server-side encryption with a customer-provided encryption
 *             key.</p>
 *          </note>
 *          <p>To use GET, you must have READ access to the object.</p>
 *          <p>This action is not supported by Amazon S3 on Outposts.</p>
 *          <p>The following action is related to <code>GetObjectTorrent</code>:</p>
 *          <ul>
 *             <li>
 *                <p>
 *                   <a href="https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html">GetObject</a>
 *                </p>
 *             </li>
 *          </ul>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { S3Client, GetObjectTorrentCommand } from "@aws-sdk/client-s3"; // ES Modules import
 * // const { S3Client, GetObjectTorrentCommand } = require("@aws-sdk/client-s3"); // CommonJS import
 * const client = new S3Client(config);
 * const input = { // GetObjectTorrentRequest
 *   Bucket: "STRING_VALUE", // required
 *   Key: "STRING_VALUE", // required
 *   RequestPayer: "requester",
 *   ExpectedBucketOwner: "STRING_VALUE",
 * };
 * const command = new GetObjectTorrentCommand(input);
 * const response = await client.send(command);
 * // { // GetObjectTorrentOutput
 * //   Body: "STREAMING_BLOB_VALUE",
 * //   RequestCharged: "requester",
 * // };
 *
 * ```
 *
 * @param GetObjectTorrentCommandInput - {@link GetObjectTorrentCommandInput}
 * @returns {@link GetObjectTorrentCommandOutput}
 * @see {@link GetObjectTorrentCommandInput} for command's `input` shape.
 * @see {@link GetObjectTorrentCommandOutput} for command's `response` shape.
 * @see {@link S3ClientResolvedConfig | config} for S3Client's `config` shape.
 *
 * @throws {@link S3ServiceException}
 * <p>Base exception class for all service exceptions from S3 service.</p>
 *
 * @example To retrieve torrent files for an object
 * ```javascript
 * // The following example retrieves torrent files of an object.
 * const input = {
 *   "Bucket": "examplebucket",
 *   "Key": "HappyFace.jpg"
 * };
 * const command = new GetObjectTorrentCommand(input);
 * await client.send(command);
 * // example id: to-retrieve-torrent-files-for-an-object-1481834115959
 * ```
 *
 */
export declare class GetObjectTorrentCommand extends $Command<GetObjectTorrentCommandInput, GetObjectTorrentCommandOutput, S3ClientResolvedConfig> {
    readonly input: GetObjectTorrentCommandInput;
    static getEndpointParameterInstructions(): EndpointParameterInstructions;
    /**
     * @public
     */
    constructor(input: GetObjectTorrentCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: S3ClientResolvedConfig, options?: __HttpHandlerOptions): Handler<GetObjectTorrentCommandInput, GetObjectTorrentCommandOutput>;
    /**
     * @internal
     */
    private serialize;
    /**
     * @internal
     */
    private deserialize;
}
