"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const smithy_client_1 = require("@smithy/smithy-client");
const AbortMultipartUploadCommand_1 = require("./commands/AbortMultipartUploadCommand");
const CompleteMultipartUploadCommand_1 = require("./commands/CompleteMultipartUploadCommand");
const CopyObjectCommand_1 = require("./commands/CopyObjectCommand");
const CreateBucketCommand_1 = require("./commands/CreateBucketCommand");
const CreateMultipartUploadCommand_1 = require("./commands/CreateMultipartUploadCommand");
const DeleteBucketAnalyticsConfigurationCommand_1 = require("./commands/DeleteBucketAnalyticsConfigurationCommand");
const DeleteBucketCommand_1 = require("./commands/DeleteBucketCommand");
const DeleteBucketCorsCommand_1 = require("./commands/DeleteBucketCorsCommand");
const DeleteBucketEncryptionCommand_1 = require("./commands/DeleteBucketEncryptionCommand");
const DeleteBucketIntelligentTieringConfigurationCommand_1 = require("./commands/DeleteBucketIntelligentTieringConfigurationCommand");
const DeleteBucketInventoryConfigurationCommand_1 = require("./commands/DeleteBucketInventoryConfigurationCommand");
const DeleteBucketLifecycleCommand_1 = require("./commands/DeleteBucketLifecycleCommand");
const DeleteBucketMetricsConfigurationCommand_1 = require("./commands/DeleteBucketMetricsConfigurationCommand");
const DeleteBucketOwnershipControlsCommand_1 = require("./commands/DeleteBucketOwnershipControlsCommand");
const DeleteBucketPolicyCommand_1 = require("./commands/DeleteBucketPolicyCommand");
const DeleteBucketReplicationCommand_1 = require("./commands/DeleteBucketReplicationCommand");
const DeleteBucketTaggingCommand_1 = require("./commands/DeleteBucketTaggingCommand");
const DeleteBucketWebsiteCommand_1 = require("./commands/DeleteBucketWebsiteCommand");
const DeleteObjectCommand_1 = require("./commands/DeleteObjectCommand");
const DeleteObjectsCommand_1 = require("./commands/DeleteObjectsCommand");
const DeleteObjectTaggingCommand_1 = require("./commands/DeleteObjectTaggingCommand");
const DeletePublicAccessBlockCommand_1 = require("./commands/DeletePublicAccessBlockCommand");
const GetBucketAccelerateConfigurationCommand_1 = require("./commands/GetBucketAccelerateConfigurationCommand");
const GetBucketAclCommand_1 = require("./commands/GetBucketAclCommand");
const GetBucketAnalyticsConfigurationCommand_1 = require("./commands/GetBucketAnalyticsConfigurationCommand");
const GetBucketCorsCommand_1 = require("./commands/GetBucketCorsCommand");
const GetBucketEncryptionCommand_1 = require("./commands/GetBucketEncryptionCommand");
const GetBucketIntelligentTieringConfigurationCommand_1 = require("./commands/GetBucketIntelligentTieringConfigurationCommand");
const GetBucketInventoryConfigurationCommand_1 = require("./commands/GetBucketInventoryConfigurationCommand");
const GetBucketLifecycleConfigurationCommand_1 = require("./commands/GetBucketLifecycleConfigurationCommand");
const GetBucketLocationCommand_1 = require("./commands/GetBucketLocationCommand");
const GetBucketLoggingCommand_1 = require("./commands/GetBucketLoggingCommand");
const GetBucketMetricsConfigurationCommand_1 = require("./commands/GetBucketMetricsConfigurationCommand");
const GetBucketNotificationConfigurationCommand_1 = require("./commands/GetBucketNotificationConfigurationCommand");
const GetBucketOwnershipControlsCommand_1 = require("./commands/GetBucketOwnershipControlsCommand");
const GetBucketPolicyCommand_1 = require("./commands/GetBucketPolicyCommand");
const GetBucketPolicyStatusCommand_1 = require("./commands/GetBucketPolicyStatusCommand");
const GetBucketReplicationCommand_1 = require("./commands/GetBucketReplicationCommand");
const GetBucketRequestPaymentCommand_1 = require("./commands/GetBucketRequestPaymentCommand");
const GetBucketTaggingCommand_1 = require("./commands/GetBucketTaggingCommand");
const GetBucketVersioningCommand_1 = require("./commands/GetBucketVersioningCommand");
const GetBucketWebsiteCommand_1 = require("./commands/GetBucketWebsiteCommand");
const GetObjectAclCommand_1 = require("./commands/GetObjectAclCommand");
const GetObjectAttributesCommand_1 = require("./commands/GetObjectAttributesCommand");
const GetObjectCommand_1 = require("./commands/GetObjectCommand");
const GetObjectLegalHoldCommand_1 = require("./commands/GetObjectLegalHoldCommand");
const GetObjectLockConfigurationCommand_1 = require("./commands/GetObjectLockConfigurationCommand");
const GetObjectRetentionCommand_1 = require("./commands/GetObjectRetentionCommand");
const GetObjectTaggingCommand_1 = require("./commands/GetObjectTaggingCommand");
const GetObjectTorrentCommand_1 = require("./commands/GetObjectTorrentCommand");
const GetPublicAccessBlockCommand_1 = require("./commands/GetPublicAccessBlockCommand");
const HeadBucketCommand_1 = require("./commands/HeadBucketCommand");
const HeadObjectCommand_1 = require("./commands/HeadObjectCommand");
const ListBucketAnalyticsConfigurationsCommand_1 = require("./commands/ListBucketAnalyticsConfigurationsCommand");
const ListBucketIntelligentTieringConfigurationsCommand_1 = require("./commands/ListBucketIntelligentTieringConfigurationsCommand");
const ListBucketInventoryConfigurationsCommand_1 = require("./commands/ListBucketInventoryConfigurationsCommand");
const ListBucketMetricsConfigurationsCommand_1 = require("./commands/ListBucketMetricsConfigurationsCommand");
const ListBucketsCommand_1 = require("./commands/ListBucketsCommand");
const ListMultipartUploadsCommand_1 = require("./commands/ListMultipartUploadsCommand");
const ListObjectsCommand_1 = require("./commands/ListObjectsCommand");
const ListObjectsV2Command_1 = require("./commands/ListObjectsV2Command");
const ListObjectVersionsCommand_1 = require("./commands/ListObjectVersionsCommand");
const ListPartsCommand_1 = require("./commands/ListPartsCommand");
const PutBucketAccelerateConfigurationCommand_1 = require("./commands/PutBucketAccelerateConfigurationCommand");
const PutBucketAclCommand_1 = require("./commands/PutBucketAclCommand");
const PutBucketAnalyticsConfigurationCommand_1 = require("./commands/PutBucketAnalyticsConfigurationCommand");
const PutBucketCorsCommand_1 = require("./commands/PutBucketCorsCommand");
const PutBucketEncryptionCommand_1 = require("./commands/PutBucketEncryptionCommand");
const PutBucketIntelligentTieringConfigurationCommand_1 = require("./commands/PutBucketIntelligentTieringConfigurationCommand");
const PutBucketInventoryConfigurationCommand_1 = require("./commands/PutBucketInventoryConfigurationCommand");
const PutBucketLifecycleConfigurationCommand_1 = require("./commands/PutBucketLifecycleConfigurationCommand");
const PutBucketLoggingCommand_1 = require("./commands/PutBucketLoggingCommand");
const PutBucketMetricsConfigurationCommand_1 = require("./commands/PutBucketMetricsConfigurationCommand");
const PutBucketNotificationConfigurationCommand_1 = require("./commands/PutBucketNotificationConfigurationCommand");
const PutBucketOwnershipControlsCommand_1 = require("./commands/PutBucketOwnershipControlsCommand");
const PutBucketPolicyCommand_1 = require("./commands/PutBucketPolicyCommand");
const PutBucketReplicationCommand_1 = require("./commands/PutBucketReplicationCommand");
const PutBucketRequestPaymentCommand_1 = require("./commands/PutBucketRequestPaymentCommand");
const PutBucketTaggingCommand_1 = require("./commands/PutBucketTaggingCommand");
const PutBucketVersioningCommand_1 = require("./commands/PutBucketVersioningCommand");
const PutBucketWebsiteCommand_1 = require("./commands/PutBucketWebsiteCommand");
const PutObjectAclCommand_1 = require("./commands/PutObjectAclCommand");
const PutObjectCommand_1 = require("./commands/PutObjectCommand");
const PutObjectLegalHoldCommand_1 = require("./commands/PutObjectLegalHoldCommand");
const PutObjectLockConfigurationCommand_1 = require("./commands/PutObjectLockConfigurationCommand");
const PutObjectRetentionCommand_1 = require("./commands/PutObjectRetentionCommand");
const PutObjectTaggingCommand_1 = require("./commands/PutObjectTaggingCommand");
const PutPublicAccessBlockCommand_1 = require("./commands/PutPublicAccessBlockCommand");
const RestoreObjectCommand_1 = require("./commands/RestoreObjectCommand");
const SelectObjectContentCommand_1 = require("./commands/SelectObjectContentCommand");
const UploadPartCommand_1 = require("./commands/UploadPartCommand");
const UploadPartCopyCommand_1 = require("./commands/UploadPartCopyCommand");
const WriteGetObjectResponseCommand_1 = require("./commands/WriteGetObjectResponseCommand");
const S3Client_1 = require("./S3Client");
const commands = {
    AbortMultipartUploadCommand: AbortMultipartUploadCommand_1.AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand: CompleteMultipartUploadCommand_1.CompleteMultipartUploadCommand,
    CopyObjectCommand: CopyObjectCommand_1.CopyObjectCommand,
    CreateBucketCommand: CreateBucketCommand_1.CreateBucketCommand,
    CreateMultipartUploadCommand: CreateMultipartUploadCommand_1.CreateMultipartUploadCommand,
    DeleteBucketCommand: DeleteBucketCommand_1.DeleteBucketCommand,
    DeleteBucketAnalyticsConfigurationCommand: DeleteBucketAnalyticsConfigurationCommand_1.DeleteBucketAnalyticsConfigurationCommand,
    DeleteBucketCorsCommand: DeleteBucketCorsCommand_1.DeleteBucketCorsCommand,
    DeleteBucketEncryptionCommand: DeleteBucketEncryptionCommand_1.DeleteBucketEncryptionCommand,
    DeleteBucketIntelligentTieringConfigurationCommand: DeleteBucketIntelligentTieringConfigurationCommand_1.DeleteBucketIntelligentTieringConfigurationCommand,
    DeleteBucketInventoryConfigurationCommand: DeleteBucketInventoryConfigurationCommand_1.DeleteBucketInventoryConfigurationCommand,
    DeleteBucketLifecycleCommand: DeleteBucketLifecycleCommand_1.DeleteBucketLifecycleCommand,
    DeleteBucketMetricsConfigurationCommand: DeleteBucketMetricsConfigurationCommand_1.DeleteBucketMetricsConfigurationCommand,
    DeleteBucketOwnershipControlsCommand: DeleteBucketOwnershipControlsCommand_1.DeleteBucketOwnershipControlsCommand,
    DeleteBucketPolicyCommand: DeleteBucketPolicyCommand_1.DeleteBucketPolicyCommand,
    DeleteBucketReplicationCommand: DeleteBucketReplicationCommand_1.DeleteBucketReplicationCommand,
    DeleteBucketTaggingCommand: DeleteBucketTaggingCommand_1.DeleteBucketTaggingCommand,
    DeleteBucketWebsiteCommand: DeleteBucketWebsiteCommand_1.DeleteBucketWebsiteCommand,
    DeleteObjectCommand: DeleteObjectCommand_1.DeleteObjectCommand,
    DeleteObjectsCommand: DeleteObjectsCommand_1.DeleteObjectsCommand,
    DeleteObjectTaggingCommand: DeleteObjectTaggingCommand_1.DeleteObjectTaggingCommand,
    DeletePublicAccessBlockCommand: DeletePublicAccessBlockCommand_1.DeletePublicAccessBlockCommand,
    GetBucketAccelerateConfigurationCommand: GetBucketAccelerateConfigurationCommand_1.GetBucketAccelerateConfigurationCommand,
    GetBucketAclCommand: GetBucketAclCommand_1.GetBucketAclCommand,
    GetBucketAnalyticsConfigurationCommand: GetBucketAnalyticsConfigurationCommand_1.GetBucketAnalyticsConfigurationCommand,
    GetBucketCorsCommand: GetBucketCorsCommand_1.GetBucketCorsCommand,
    GetBucketEncryptionCommand: GetBucketEncryptionCommand_1.GetBucketEncryptionCommand,
    GetBucketIntelligentTieringConfigurationCommand: GetBucketIntelligentTieringConfigurationCommand_1.GetBucketIntelligentTieringConfigurationCommand,
    GetBucketInventoryConfigurationCommand: GetBucketInventoryConfigurationCommand_1.GetBucketInventoryConfigurationCommand,
    GetBucketLifecycleConfigurationCommand: GetBucketLifecycleConfigurationCommand_1.GetBucketLifecycleConfigurationCommand,
    GetBucketLocationCommand: GetBucketLocationCommand_1.GetBucketLocationCommand,
    GetBucketLoggingCommand: GetBucketLoggingCommand_1.GetBucketLoggingCommand,
    GetBucketMetricsConfigurationCommand: GetBucketMetricsConfigurationCommand_1.GetBucketMetricsConfigurationCommand,
    GetBucketNotificationConfigurationCommand: GetBucketNotificationConfigurationCommand_1.GetBucketNotificationConfigurationCommand,
    GetBucketOwnershipControlsCommand: GetBucketOwnershipControlsCommand_1.GetBucketOwnershipControlsCommand,
    GetBucketPolicyCommand: GetBucketPolicyCommand_1.GetBucketPolicyCommand,
    GetBucketPolicyStatusCommand: GetBucketPolicyStatusCommand_1.GetBucketPolicyStatusCommand,
    GetBucketReplicationCommand: GetBucketReplicationCommand_1.GetBucketReplicationCommand,
    GetBucketRequestPaymentCommand: GetBucketRequestPaymentCommand_1.GetBucketRequestPaymentCommand,
    GetBucketTaggingCommand: GetBucketTaggingCommand_1.GetBucketTaggingCommand,
    GetBucketVersioningCommand: GetBucketVersioningCommand_1.GetBucketVersioningCommand,
    GetBucketWebsiteCommand: GetBucketWebsiteCommand_1.GetBucketWebsiteCommand,
    GetObjectCommand: GetObjectCommand_1.GetObjectCommand,
    GetObjectAclCommand: GetObjectAclCommand_1.GetObjectAclCommand,
    GetObjectAttributesCommand: GetObjectAttributesCommand_1.GetObjectAttributesCommand,
    GetObjectLegalHoldCommand: GetObjectLegalHoldCommand_1.GetObjectLegalHoldCommand,
    GetObjectLockConfigurationCommand: GetObjectLockConfigurationCommand_1.GetObjectLockConfigurationCommand,
    GetObjectRetentionCommand: GetObjectRetentionCommand_1.GetObjectRetentionCommand,
    GetObjectTaggingCommand: GetObjectTaggingCommand_1.GetObjectTaggingCommand,
    GetObjectTorrentCommand: GetObjectTorrentCommand_1.GetObjectTorrentCommand,
    GetPublicAccessBlockCommand: GetPublicAccessBlockCommand_1.GetPublicAccessBlockCommand,
    HeadBucketCommand: HeadBucketCommand_1.HeadBucketCommand,
    HeadObjectCommand: HeadObjectCommand_1.HeadObjectCommand,
    ListBucketAnalyticsConfigurationsCommand: ListBucketAnalyticsConfigurationsCommand_1.ListBucketAnalyticsConfigurationsCommand,
    ListBucketIntelligentTieringConfigurationsCommand: ListBucketIntelligentTieringConfigurationsCommand_1.ListBucketIntelligentTieringConfigurationsCommand,
    ListBucketInventoryConfigurationsCommand: ListBucketInventoryConfigurationsCommand_1.ListBucketInventoryConfigurationsCommand,
    ListBucketMetricsConfigurationsCommand: ListBucketMetricsConfigurationsCommand_1.ListBucketMetricsConfigurationsCommand,
    ListBucketsCommand: ListBucketsCommand_1.ListBucketsCommand,
    ListMultipartUploadsCommand: ListMultipartUploadsCommand_1.ListMultipartUploadsCommand,
    ListObjectsCommand: ListObjectsCommand_1.ListObjectsCommand,
    ListObjectsV2Command: ListObjectsV2Command_1.ListObjectsV2Command,
    ListObjectVersionsCommand: ListObjectVersionsCommand_1.ListObjectVersionsCommand,
    ListPartsCommand: ListPartsCommand_1.ListPartsCommand,
    PutBucketAccelerateConfigurationCommand: PutBucketAccelerateConfigurationCommand_1.PutBucketAccelerateConfigurationCommand,
    PutBucketAclCommand: PutBucketAclCommand_1.PutBucketAclCommand,
    PutBucketAnalyticsConfigurationCommand: PutBucketAnalyticsConfigurationCommand_1.PutBucketAnalyticsConfigurationCommand,
    PutBucketCorsCommand: PutBucketCorsCommand_1.PutBucketCorsCommand,
    PutBucketEncryptionCommand: PutBucketEncryptionCommand_1.PutBucketEncryptionCommand,
    PutBucketIntelligentTieringConfigurationCommand: PutBucketIntelligentTieringConfigurationCommand_1.PutBucketIntelligentTieringConfigurationCommand,
    PutBucketInventoryConfigurationCommand: PutBucketInventoryConfigurationCommand_1.PutBucketInventoryConfigurationCommand,
    PutBucketLifecycleConfigurationCommand: PutBucketLifecycleConfigurationCommand_1.PutBucketLifecycleConfigurationCommand,
    PutBucketLoggingCommand: PutBucketLoggingCommand_1.PutBucketLoggingCommand,
    PutBucketMetricsConfigurationCommand: PutBucketMetricsConfigurationCommand_1.PutBucketMetricsConfigurationCommand,
    PutBucketNotificationConfigurationCommand: PutBucketNotificationConfigurationCommand_1.PutBucketNotificationConfigurationCommand,
    PutBucketOwnershipControlsCommand: PutBucketOwnershipControlsCommand_1.PutBucketOwnershipControlsCommand,
    PutBucketPolicyCommand: PutBucketPolicyCommand_1.PutBucketPolicyCommand,
    PutBucketReplicationCommand: PutBucketReplicationCommand_1.PutBucketReplicationCommand,
    PutBucketRequestPaymentCommand: PutBucketRequestPaymentCommand_1.PutBucketRequestPaymentCommand,
    PutBucketTaggingCommand: PutBucketTaggingCommand_1.PutBucketTaggingCommand,
    PutBucketVersioningCommand: PutBucketVersioningCommand_1.PutBucketVersioningCommand,
    PutBucketWebsiteCommand: PutBucketWebsiteCommand_1.PutBucketWebsiteCommand,
    PutObjectCommand: PutObjectCommand_1.PutObjectCommand,
    PutObjectAclCommand: PutObjectAclCommand_1.PutObjectAclCommand,
    PutObjectLegalHoldCommand: PutObjectLegalHoldCommand_1.PutObjectLegalHoldCommand,
    PutObjectLockConfigurationCommand: PutObjectLockConfigurationCommand_1.PutObjectLockConfigurationCommand,
    PutObjectRetentionCommand: PutObjectRetentionCommand_1.PutObjectRetentionCommand,
    PutObjectTaggingCommand: PutObjectTaggingCommand_1.PutObjectTaggingCommand,
    PutPublicAccessBlockCommand: PutPublicAccessBlockCommand_1.PutPublicAccessBlockCommand,
    RestoreObjectCommand: RestoreObjectCommand_1.RestoreObjectCommand,
    SelectObjectContentCommand: SelectObjectContentCommand_1.SelectObjectContentCommand,
    UploadPartCommand: UploadPartCommand_1.UploadPartCommand,
    UploadPartCopyCommand: UploadPartCopyCommand_1.UploadPartCopyCommand,
    WriteGetObjectResponseCommand: WriteGetObjectResponseCommand_1.WriteGetObjectResponseCommand,
};
class S3 extends S3Client_1.S3Client {
}
exports.S3 = S3;
(0, smithy_client_1.createAggregatedClient)(commands, S3);
