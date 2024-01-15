import { XmlNode as __XmlNode, XmlText as __XmlText } from "@aws-sdk/xml-builder";
import { HttpRequest as __HttpRequest, isValidHostname as __isValidHostname, } from "@smithy/protocol-http";
import { collectBody, dateToUtcString as __dateToUtcString, decorateServiceException as __decorateServiceException, expectNonNull as __expectNonNull, expectObject as __expectObject, expectString as __expectString, expectUnion as __expectUnion, getArrayIfSingleItem as __getArrayIfSingleItem, getValueFromTextNode as __getValueFromTextNode, map, parseBoolean as __parseBoolean, parseRfc3339DateTimeWithOffset as __parseRfc3339DateTimeWithOffset, parseRfc7231DateTime as __parseRfc7231DateTime, resolvedPath as __resolvedPath, strictParseInt32 as __strictParseInt32, strictParseLong as __strictParseLong, withBaseException, } from "@smithy/smithy-client";
import { XMLParser } from "fast-xml-parser";
import { AnalyticsFilter, BucketAlreadyExists, BucketAlreadyOwnedByYou, InvalidObjectState, LifecycleRuleFilter, MetricsFilter, NoSuchBucket, NoSuchKey, NoSuchUpload, NotFound, ObjectNotInActiveTierError, ReplicationRuleFilter, } from "../models/models_0";
import { ObjectAlreadyInActiveTierError, } from "../models/models_1";
import { S3ServiceException as __BaseException } from "../models/S3ServiceException";
export const se_AbortMultipartUploadCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "AbortMultipartUpload"],
        uploadId: [, __expectNonNull(input.UploadId, `UploadId`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_CompleteMultipartUploadCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-checksum-crc32": input.ChecksumCRC32,
        "x-amz-checksum-crc32c": input.ChecksumCRC32C,
        "x-amz-checksum-sha1": input.ChecksumSHA1,
        "x-amz-checksum-sha256": input.ChecksumSHA256,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "CompleteMultipartUpload"],
        uploadId: [, __expectNonNull(input.UploadId, `UploadId`)],
    });
    let body;
    if (input.MultipartUpload !== undefined) {
        body = se_CompletedMultipartUpload(input.MultipartUpload, context);
    }
    let contents;
    if (input.MultipartUpload !== undefined) {
        contents = se_CompletedMultipartUpload(input.MultipartUpload, context);
        contents = contents.withName("CompleteMultipartUpload");
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_CopyObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-acl": input.ACL,
        "cache-control": input.CacheControl,
        "x-amz-checksum-algorithm": input.ChecksumAlgorithm,
        "content-disposition": input.ContentDisposition,
        "content-encoding": input.ContentEncoding,
        "content-language": input.ContentLanguage,
        "content-type": input.ContentType,
        "x-amz-copy-source": input.CopySource,
        "x-amz-copy-source-if-match": input.CopySourceIfMatch,
        "x-amz-copy-source-if-modified-since": [
            () => isSerializableHeaderValue(input.CopySourceIfModifiedSince),
            () => __dateToUtcString(input.CopySourceIfModifiedSince).toString(),
        ],
        "x-amz-copy-source-if-none-match": input.CopySourceIfNoneMatch,
        "x-amz-copy-source-if-unmodified-since": [
            () => isSerializableHeaderValue(input.CopySourceIfUnmodifiedSince),
            () => __dateToUtcString(input.CopySourceIfUnmodifiedSince).toString(),
        ],
        expires: [() => isSerializableHeaderValue(input.Expires), () => __dateToUtcString(input.Expires).toString()],
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-metadata-directive": input.MetadataDirective,
        "x-amz-tagging-directive": input.TaggingDirective,
        "x-amz-server-side-encryption": input.ServerSideEncryption,
        "x-amz-storage-class": input.StorageClass,
        "x-amz-website-redirect-location": input.WebsiteRedirectLocation,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-server-side-encryption-aws-kms-key-id": input.SSEKMSKeyId,
        "x-amz-server-side-encryption-context": input.SSEKMSEncryptionContext,
        "x-amz-server-side-encryption-bucket-key-enabled": [
            () => isSerializableHeaderValue(input.BucketKeyEnabled),
            () => input.BucketKeyEnabled.toString(),
        ],
        "x-amz-copy-source-server-side-encryption-customer-algorithm": input.CopySourceSSECustomerAlgorithm,
        "x-amz-copy-source-server-side-encryption-customer-key": input.CopySourceSSECustomerKey,
        "x-amz-copy-source-server-side-encryption-customer-key-md5": input.CopySourceSSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-tagging": input.Tagging,
        "x-amz-object-lock-mode": input.ObjectLockMode,
        "x-amz-object-lock-retain-until-date": [
            () => isSerializableHeaderValue(input.ObjectLockRetainUntilDate),
            () => (input.ObjectLockRetainUntilDate.toISOString().split(".")[0] + "Z").toString(),
        ],
        "x-amz-object-lock-legal-hold": input.ObjectLockLegalHoldStatus,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-source-expected-bucket-owner": input.ExpectedSourceBucketOwner,
        ...(input.Metadata !== undefined &&
            Object.keys(input.Metadata).reduce((acc, suffix) => {
                acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
                return acc;
            }, {})),
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "CopyObject"],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_CreateBucketCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-acl": input.ACL,
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write": input.GrantWrite,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-bucket-object-lock-enabled": [
            () => isSerializableHeaderValue(input.ObjectLockEnabledForBucket),
            () => input.ObjectLockEnabledForBucket.toString(),
        ],
        "x-amz-object-ownership": input.ObjectOwnership,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    let body;
    if (input.CreateBucketConfiguration !== undefined) {
        body = se_CreateBucketConfiguration(input.CreateBucketConfiguration, context);
    }
    let contents;
    if (input.CreateBucketConfiguration !== undefined) {
        contents = se_CreateBucketConfiguration(input.CreateBucketConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        body,
    });
};
export const se_CreateMultipartUploadCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-acl": input.ACL,
        "cache-control": input.CacheControl,
        "content-disposition": input.ContentDisposition,
        "content-encoding": input.ContentEncoding,
        "content-language": input.ContentLanguage,
        "content-type": input.ContentType,
        expires: [() => isSerializableHeaderValue(input.Expires), () => __dateToUtcString(input.Expires).toString()],
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-server-side-encryption": input.ServerSideEncryption,
        "x-amz-storage-class": input.StorageClass,
        "x-amz-website-redirect-location": input.WebsiteRedirectLocation,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-server-side-encryption-aws-kms-key-id": input.SSEKMSKeyId,
        "x-amz-server-side-encryption-context": input.SSEKMSEncryptionContext,
        "x-amz-server-side-encryption-bucket-key-enabled": [
            () => isSerializableHeaderValue(input.BucketKeyEnabled),
            () => input.BucketKeyEnabled.toString(),
        ],
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-tagging": input.Tagging,
        "x-amz-object-lock-mode": input.ObjectLockMode,
        "x-amz-object-lock-retain-until-date": [
            () => isSerializableHeaderValue(input.ObjectLockRetainUntilDate),
            () => (input.ObjectLockRetainUntilDate.toISOString().split(".")[0] + "Z").toString(),
        ],
        "x-amz-object-lock-legal-hold": input.ObjectLockLegalHoldStatus,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-checksum-algorithm": input.ChecksumAlgorithm,
        ...(input.Metadata !== undefined &&
            Object.keys(input.Metadata).reduce((acc, suffix) => {
                acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
                return acc;
            }, {})),
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        uploads: [, ""],
        "x-id": [, "CreateMultipartUpload"],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        body,
    });
};
export const se_DeleteBucketAnalyticsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        analytics: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketCorsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        cors: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketEncryptionCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        encryption: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketIntelligentTieringConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = {};
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "intelligent-tiering": [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketInventoryConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        inventory: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketLifecycleCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        lifecycle: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketMetricsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        metrics: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketOwnershipControlsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        ownershipControls: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketPolicyCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        policy: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketReplicationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        replication: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        tagging: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteBucketWebsiteCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        website: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-mfa": input.MFA,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-bypass-governance-retention": [
            () => isSerializableHeaderValue(input.BypassGovernanceRetention),
            () => input.BypassGovernanceRetention.toString(),
        ],
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "DeleteObject"],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteObjectsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-mfa": input.MFA,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-bypass-governance-retention": [
            () => isSerializableHeaderValue(input.BypassGovernanceRetention),
            () => input.BypassGovernanceRetention.toString(),
        ],
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        delete: [, ""],
        "x-id": [, "DeleteObjects"],
    });
    let body;
    if (input.Delete !== undefined) {
        body = se_Delete(input.Delete, context);
    }
    let contents;
    if (input.Delete !== undefined) {
        contents = se_Delete(input.Delete, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeleteObjectTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        tagging: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_DeletePublicAccessBlockCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        publicAccessBlock: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "DELETE",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketAccelerateConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-request-payer": input.RequestPayer,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        accelerate: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketAclCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        acl: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketAnalyticsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        analytics: [, ""],
        "x-id": [, "GetBucketAnalyticsConfiguration"],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketCorsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        cors: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketEncryptionCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        encryption: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketIntelligentTieringConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = {};
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "intelligent-tiering": [, ""],
        "x-id": [, "GetBucketIntelligentTieringConfiguration"],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketInventoryConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        inventory: [, ""],
        "x-id": [, "GetBucketInventoryConfiguration"],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketLifecycleConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        lifecycle: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketLocationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        location: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketLoggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        logging: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketMetricsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        metrics: [, ""],
        "x-id": [, "GetBucketMetricsConfiguration"],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketNotificationConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        notification: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketOwnershipControlsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        ownershipControls: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketPolicyCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        policy: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketPolicyStatusCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        policyStatus: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketReplicationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        replication: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketRequestPaymentCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        requestPayment: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        tagging: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketVersioningCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        versioning: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetBucketWebsiteCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        website: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "if-match": input.IfMatch,
        "if-modified-since": [
            () => isSerializableHeaderValue(input.IfModifiedSince),
            () => __dateToUtcString(input.IfModifiedSince).toString(),
        ],
        "if-none-match": input.IfNoneMatch,
        "if-unmodified-since": [
            () => isSerializableHeaderValue(input.IfUnmodifiedSince),
            () => __dateToUtcString(input.IfUnmodifiedSince).toString(),
        ],
        range: input.Range,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-checksum-mode": input.ChecksumMode,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "GetObject"],
        "response-cache-control": [, input.ResponseCacheControl],
        "response-content-disposition": [, input.ResponseContentDisposition],
        "response-content-encoding": [, input.ResponseContentEncoding],
        "response-content-language": [, input.ResponseContentLanguage],
        "response-content-type": [, input.ResponseContentType],
        "response-expires": [
            () => input.ResponseExpires !== void 0,
            () => __dateToUtcString(input.ResponseExpires).toString(),
        ],
        versionId: [, input.VersionId],
        partNumber: [() => input.PartNumber !== void 0, () => input.PartNumber.toString()],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectAclCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        acl: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectAttributesCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-max-parts": [() => isSerializableHeaderValue(input.MaxParts), () => input.MaxParts.toString()],
        "x-amz-part-number-marker": input.PartNumberMarker,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-object-attributes": [
            () => isSerializableHeaderValue(input.ObjectAttributes),
            () => (input.ObjectAttributes || []).map((_entry) => _entry).join(", "),
        ],
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        attributes: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectLegalHoldCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "legal-hold": [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectLockConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "object-lock": [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectRetentionCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        retention: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-request-payer": input.RequestPayer,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        tagging: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetObjectTorrentCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        torrent: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_GetPublicAccessBlockCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        publicAccessBlock: [, ""],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_HeadBucketCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "HEAD",
        headers,
        path: resolvedPath,
        body,
    });
};
export const se_HeadObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "if-match": input.IfMatch,
        "if-modified-since": [
            () => isSerializableHeaderValue(input.IfModifiedSince),
            () => __dateToUtcString(input.IfModifiedSince).toString(),
        ],
        "if-none-match": input.IfNoneMatch,
        "if-unmodified-since": [
            () => isSerializableHeaderValue(input.IfUnmodifiedSince),
            () => __dateToUtcString(input.IfUnmodifiedSince).toString(),
        ],
        range: input.Range,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-checksum-mode": input.ChecksumMode,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        versionId: [, input.VersionId],
        partNumber: [() => input.PartNumber !== void 0, () => input.PartNumber.toString()],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "HEAD",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListBucketAnalyticsConfigurationsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        analytics: [, ""],
        "x-id": [, "ListBucketAnalyticsConfigurations"],
        "continuation-token": [, input.ContinuationToken],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListBucketIntelligentTieringConfigurationsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = {};
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "intelligent-tiering": [, ""],
        "x-id": [, "ListBucketIntelligentTieringConfigurations"],
        "continuation-token": [, input.ContinuationToken],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListBucketInventoryConfigurationsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        inventory: [, ""],
        "x-id": [, "ListBucketInventoryConfigurations"],
        "continuation-token": [, input.ContinuationToken],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListBucketMetricsConfigurationsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        metrics: [, ""],
        "x-id": [, "ListBucketMetricsConfigurations"],
        "continuation-token": [, input.ContinuationToken],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListBucketsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = {
        "content-type": "application/xml",
    };
    const resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    let body;
    body = "";
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        body,
    });
};
export const se_ListMultipartUploadsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-request-payer": input.RequestPayer,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        uploads: [, ""],
        delimiter: [, input.Delimiter],
        "encoding-type": [, input.EncodingType],
        "key-marker": [, input.KeyMarker],
        "max-uploads": [() => input.MaxUploads !== void 0, () => input.MaxUploads.toString()],
        prefix: [, input.Prefix],
        "upload-id-marker": [, input.UploadIdMarker],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListObjectsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-optional-object-attributes": [
            () => isSerializableHeaderValue(input.OptionalObjectAttributes),
            () => (input.OptionalObjectAttributes || []).map((_entry) => _entry).join(", "),
        ],
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        delimiter: [, input.Delimiter],
        "encoding-type": [, input.EncodingType],
        marker: [, input.Marker],
        "max-keys": [() => input.MaxKeys !== void 0, () => input.MaxKeys.toString()],
        prefix: [, input.Prefix],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListObjectsV2Command = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-optional-object-attributes": [
            () => isSerializableHeaderValue(input.OptionalObjectAttributes),
            () => (input.OptionalObjectAttributes || []).map((_entry) => _entry).join(", "),
        ],
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "list-type": [, "2"],
        delimiter: [, input.Delimiter],
        "encoding-type": [, input.EncodingType],
        "max-keys": [() => input.MaxKeys !== void 0, () => input.MaxKeys.toString()],
        prefix: [, input.Prefix],
        "continuation-token": [, input.ContinuationToken],
        "fetch-owner": [() => input.FetchOwner !== void 0, () => input.FetchOwner.toString()],
        "start-after": [, input.StartAfter],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListObjectVersionsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-optional-object-attributes": [
            () => isSerializableHeaderValue(input.OptionalObjectAttributes),
            () => (input.OptionalObjectAttributes || []).map((_entry) => _entry).join(", "),
        ],
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        versions: [, ""],
        delimiter: [, input.Delimiter],
        "encoding-type": [, input.EncodingType],
        "key-marker": [, input.KeyMarker],
        "max-keys": [() => input.MaxKeys !== void 0, () => input.MaxKeys.toString()],
        prefix: [, input.Prefix],
        "version-id-marker": [, input.VersionIdMarker],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_ListPartsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "ListParts"],
        "max-parts": [() => input.MaxParts !== void 0, () => input.MaxParts.toString()],
        "part-number-marker": [, input.PartNumberMarker],
        uploadId: [, __expectNonNull(input.UploadId, `UploadId`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "GET",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketAccelerateConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        accelerate: [, ""],
    });
    let body;
    if (input.AccelerateConfiguration !== undefined) {
        body = se_AccelerateConfiguration(input.AccelerateConfiguration, context);
    }
    let contents;
    if (input.AccelerateConfiguration !== undefined) {
        contents = se_AccelerateConfiguration(input.AccelerateConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketAclCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-acl": input.ACL,
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write": input.GrantWrite,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        acl: [, ""],
    });
    let body;
    if (input.AccessControlPolicy !== undefined) {
        body = se_AccessControlPolicy(input.AccessControlPolicy, context);
    }
    let contents;
    if (input.AccessControlPolicy !== undefined) {
        contents = se_AccessControlPolicy(input.AccessControlPolicy, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketAnalyticsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        analytics: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    if (input.AnalyticsConfiguration !== undefined) {
        body = se_AnalyticsConfiguration(input.AnalyticsConfiguration, context);
    }
    let contents;
    if (input.AnalyticsConfiguration !== undefined) {
        contents = se_AnalyticsConfiguration(input.AnalyticsConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketCorsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        cors: [, ""],
    });
    let body;
    if (input.CORSConfiguration !== undefined) {
        body = se_CORSConfiguration(input.CORSConfiguration, context);
    }
    let contents;
    if (input.CORSConfiguration !== undefined) {
        contents = se_CORSConfiguration(input.CORSConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketEncryptionCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        encryption: [, ""],
    });
    let body;
    if (input.ServerSideEncryptionConfiguration !== undefined) {
        body = se_ServerSideEncryptionConfiguration(input.ServerSideEncryptionConfiguration, context);
    }
    let contents;
    if (input.ServerSideEncryptionConfiguration !== undefined) {
        contents = se_ServerSideEncryptionConfiguration(input.ServerSideEncryptionConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketIntelligentTieringConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = {
        "content-type": "application/xml",
    };
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "intelligent-tiering": [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    if (input.IntelligentTieringConfiguration !== undefined) {
        body = se_IntelligentTieringConfiguration(input.IntelligentTieringConfiguration, context);
    }
    let contents;
    if (input.IntelligentTieringConfiguration !== undefined) {
        contents = se_IntelligentTieringConfiguration(input.IntelligentTieringConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketInventoryConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        inventory: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    if (input.InventoryConfiguration !== undefined) {
        body = se_InventoryConfiguration(input.InventoryConfiguration, context);
    }
    let contents;
    if (input.InventoryConfiguration !== undefined) {
        contents = se_InventoryConfiguration(input.InventoryConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketLifecycleConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        lifecycle: [, ""],
    });
    let body;
    if (input.LifecycleConfiguration !== undefined) {
        body = se_BucketLifecycleConfiguration(input.LifecycleConfiguration, context);
    }
    let contents;
    if (input.LifecycleConfiguration !== undefined) {
        contents = se_BucketLifecycleConfiguration(input.LifecycleConfiguration, context);
        contents = contents.withName("LifecycleConfiguration");
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketLoggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        logging: [, ""],
    });
    let body;
    if (input.BucketLoggingStatus !== undefined) {
        body = se_BucketLoggingStatus(input.BucketLoggingStatus, context);
    }
    let contents;
    if (input.BucketLoggingStatus !== undefined) {
        contents = se_BucketLoggingStatus(input.BucketLoggingStatus, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketMetricsConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        metrics: [, ""],
        id: [, __expectNonNull(input.Id, `Id`)],
    });
    let body;
    if (input.MetricsConfiguration !== undefined) {
        body = se_MetricsConfiguration(input.MetricsConfiguration, context);
    }
    let contents;
    if (input.MetricsConfiguration !== undefined) {
        contents = se_MetricsConfiguration(input.MetricsConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketNotificationConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-skip-destination-validation": [
            () => isSerializableHeaderValue(input.SkipDestinationValidation),
            () => input.SkipDestinationValidation.toString(),
        ],
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        notification: [, ""],
    });
    let body;
    if (input.NotificationConfiguration !== undefined) {
        body = se_NotificationConfiguration(input.NotificationConfiguration, context);
    }
    let contents;
    if (input.NotificationConfiguration !== undefined) {
        contents = se_NotificationConfiguration(input.NotificationConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketOwnershipControlsCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        ownershipControls: [, ""],
    });
    let body;
    if (input.OwnershipControls !== undefined) {
        body = se_OwnershipControls(input.OwnershipControls, context);
    }
    let contents;
    if (input.OwnershipControls !== undefined) {
        contents = se_OwnershipControls(input.OwnershipControls, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketPolicyCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "text/plain",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-confirm-remove-self-bucket-access": [
            () => isSerializableHeaderValue(input.ConfirmRemoveSelfBucketAccess),
            () => input.ConfirmRemoveSelfBucketAccess.toString(),
        ],
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        policy: [, ""],
    });
    let body;
    if (input.Policy !== undefined) {
        body = input.Policy;
    }
    let contents;
    if (input.Policy !== undefined) {
        contents = input.Policy;
        body = contents;
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketReplicationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-bucket-object-lock-token": input.Token,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        replication: [, ""],
    });
    let body;
    if (input.ReplicationConfiguration !== undefined) {
        body = se_ReplicationConfiguration(input.ReplicationConfiguration, context);
    }
    let contents;
    if (input.ReplicationConfiguration !== undefined) {
        contents = se_ReplicationConfiguration(input.ReplicationConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketRequestPaymentCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        requestPayment: [, ""],
    });
    let body;
    if (input.RequestPaymentConfiguration !== undefined) {
        body = se_RequestPaymentConfiguration(input.RequestPaymentConfiguration, context);
    }
    let contents;
    if (input.RequestPaymentConfiguration !== undefined) {
        contents = se_RequestPaymentConfiguration(input.RequestPaymentConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        tagging: [, ""],
    });
    let body;
    if (input.Tagging !== undefined) {
        body = se_Tagging(input.Tagging, context);
    }
    let contents;
    if (input.Tagging !== undefined) {
        contents = se_Tagging(input.Tagging, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketVersioningCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-mfa": input.MFA,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        versioning: [, ""],
    });
    let body;
    if (input.VersioningConfiguration !== undefined) {
        body = se_VersioningConfiguration(input.VersioningConfiguration, context);
    }
    let contents;
    if (input.VersioningConfiguration !== undefined) {
        contents = se_VersioningConfiguration(input.VersioningConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutBucketWebsiteCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        website: [, ""],
    });
    let body;
    if (input.WebsiteConfiguration !== undefined) {
        body = se_WebsiteConfiguration(input.WebsiteConfiguration, context);
    }
    let contents;
    if (input.WebsiteConfiguration !== undefined) {
        contents = se_WebsiteConfiguration(input.WebsiteConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": input.ContentType || "application/octet-stream",
        "x-amz-acl": input.ACL,
        "cache-control": input.CacheControl,
        "content-disposition": input.ContentDisposition,
        "content-encoding": input.ContentEncoding,
        "content-language": input.ContentLanguage,
        "content-length": [() => isSerializableHeaderValue(input.ContentLength), () => input.ContentLength.toString()],
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-checksum-crc32": input.ChecksumCRC32,
        "x-amz-checksum-crc32c": input.ChecksumCRC32C,
        "x-amz-checksum-sha1": input.ChecksumSHA1,
        "x-amz-checksum-sha256": input.ChecksumSHA256,
        expires: [() => isSerializableHeaderValue(input.Expires), () => __dateToUtcString(input.Expires).toString()],
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-server-side-encryption": input.ServerSideEncryption,
        "x-amz-storage-class": input.StorageClass,
        "x-amz-website-redirect-location": input.WebsiteRedirectLocation,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-server-side-encryption-aws-kms-key-id": input.SSEKMSKeyId,
        "x-amz-server-side-encryption-context": input.SSEKMSEncryptionContext,
        "x-amz-server-side-encryption-bucket-key-enabled": [
            () => isSerializableHeaderValue(input.BucketKeyEnabled),
            () => input.BucketKeyEnabled.toString(),
        ],
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-tagging": input.Tagging,
        "x-amz-object-lock-mode": input.ObjectLockMode,
        "x-amz-object-lock-retain-until-date": [
            () => isSerializableHeaderValue(input.ObjectLockRetainUntilDate),
            () => (input.ObjectLockRetainUntilDate.toISOString().split(".")[0] + "Z").toString(),
        ],
        "x-amz-object-lock-legal-hold": input.ObjectLockLegalHoldStatus,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        ...(input.Metadata !== undefined &&
            Object.keys(input.Metadata).reduce((acc, suffix) => {
                acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
                return acc;
            }, {})),
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "PutObject"],
    });
    let body;
    if (input.Body !== undefined) {
        body = input.Body;
    }
    let contents;
    if (input.Body !== undefined) {
        contents = input.Body;
        body = contents;
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectAclCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-acl": input.ACL,
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-grant-full-control": input.GrantFullControl,
        "x-amz-grant-read": input.GrantRead,
        "x-amz-grant-read-acp": input.GrantReadACP,
        "x-amz-grant-write": input.GrantWrite,
        "x-amz-grant-write-acp": input.GrantWriteACP,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        acl: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    if (input.AccessControlPolicy !== undefined) {
        body = se_AccessControlPolicy(input.AccessControlPolicy, context);
    }
    let contents;
    if (input.AccessControlPolicy !== undefined) {
        contents = se_AccessControlPolicy(input.AccessControlPolicy, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectLegalHoldCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-request-payer": input.RequestPayer,
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "legal-hold": [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    if (input.LegalHold !== undefined) {
        body = se_ObjectLockLegalHold(input.LegalHold, context);
    }
    let contents;
    if (input.LegalHold !== undefined) {
        contents = se_ObjectLockLegalHold(input.LegalHold, context);
        contents = contents.withName("LegalHold");
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectLockConfigurationCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-bucket-object-lock-token": input.Token,
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        "object-lock": [, ""],
    });
    let body;
    if (input.ObjectLockConfiguration !== undefined) {
        body = se_ObjectLockConfiguration(input.ObjectLockConfiguration, context);
    }
    let contents;
    if (input.ObjectLockConfiguration !== undefined) {
        contents = se_ObjectLockConfiguration(input.ObjectLockConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectRetentionCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-bypass-governance-retention": [
            () => isSerializableHeaderValue(input.BypassGovernanceRetention),
            () => input.BypassGovernanceRetention.toString(),
        ],
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        retention: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    if (input.Retention !== undefined) {
        body = se_ObjectLockRetention(input.Retention, context);
    }
    let contents;
    if (input.Retention !== undefined) {
        contents = se_ObjectLockRetention(input.Retention, context);
        contents = contents.withName("Retention");
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutObjectTaggingCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-request-payer": input.RequestPayer,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        tagging: [, ""],
        versionId: [, input.VersionId],
    });
    let body;
    if (input.Tagging !== undefined) {
        body = se_Tagging(input.Tagging, context);
    }
    let contents;
    if (input.Tagging !== undefined) {
        contents = se_Tagging(input.Tagging, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_PutPublicAccessBlockCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    const query = map({
        publicAccessBlock: [, ""],
    });
    let body;
    if (input.PublicAccessBlockConfiguration !== undefined) {
        body = se_PublicAccessBlockConfiguration(input.PublicAccessBlockConfiguration, context);
    }
    let contents;
    if (input.PublicAccessBlockConfiguration !== undefined) {
        contents = se_PublicAccessBlockConfiguration(input.PublicAccessBlockConfiguration, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_RestoreObjectCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        restore: [, ""],
        "x-id": [, "RestoreObject"],
        versionId: [, input.VersionId],
    });
    let body;
    if (input.RestoreRequest !== undefined) {
        body = se_RestoreRequest(input.RestoreRequest, context);
    }
    let contents;
    if (input.RestoreRequest !== undefined) {
        contents = se_RestoreRequest(input.RestoreRequest, context);
        body = '<?xml version="1.0" encoding="UTF-8"?>';
        contents.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
        body += contents.toString();
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_SelectObjectContentCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/xml",
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        select: [, ""],
        "select-type": [, "2"],
        "x-id": [, "SelectObjectContent"],
    });
    let body;
    body = '<?xml version="1.0" encoding="UTF-8"?>';
    const bodyNode = new __XmlNode("SelectObjectContentRequest");
    bodyNode.addAttribute("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    if (input.Expression !== undefined) {
        const node = __XmlNode.of("Expression", input.Expression).withName("Expression");
        bodyNode.addChildNode(node);
    }
    if (input.ExpressionType !== undefined) {
        const node = __XmlNode.of("ExpressionType", input.ExpressionType).withName("ExpressionType");
        bodyNode.addChildNode(node);
    }
    if (input.InputSerialization !== undefined) {
        const node = se_InputSerialization(input.InputSerialization, context).withName("InputSerialization");
        bodyNode.addChildNode(node);
    }
    if (input.OutputSerialization !== undefined) {
        const node = se_OutputSerialization(input.OutputSerialization, context).withName("OutputSerialization");
        bodyNode.addChildNode(node);
    }
    if (input.RequestProgress !== undefined) {
        const node = se_RequestProgress(input.RequestProgress, context).withName("RequestProgress");
        bodyNode.addChildNode(node);
    }
    if (input.ScanRange !== undefined) {
        const node = se_ScanRange(input.ScanRange, context).withName("ScanRange");
        bodyNode.addChildNode(node);
    }
    body += bodyNode.toString();
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_UploadPartCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "content-type": "application/octet-stream",
        "content-length": [() => isSerializableHeaderValue(input.ContentLength), () => input.ContentLength.toString()],
        "content-md5": input.ContentMD5,
        "x-amz-sdk-checksum-algorithm": input.ChecksumAlgorithm,
        "x-amz-checksum-crc32": input.ChecksumCRC32,
        "x-amz-checksum-crc32c": input.ChecksumCRC32C,
        "x-amz-checksum-sha1": input.ChecksumSHA1,
        "x-amz-checksum-sha256": input.ChecksumSHA256,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "UploadPart"],
        partNumber: [__expectNonNull(input.PartNumber, `PartNumber`) != null, () => input.PartNumber.toString()],
        uploadId: [, __expectNonNull(input.UploadId, `UploadId`)],
    });
    let body;
    if (input.Body !== undefined) {
        body = input.Body;
    }
    let contents;
    if (input.Body !== undefined) {
        contents = input.Body;
        body = contents;
    }
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_UploadPartCopyCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-copy-source": input.CopySource,
        "x-amz-copy-source-if-match": input.CopySourceIfMatch,
        "x-amz-copy-source-if-modified-since": [
            () => isSerializableHeaderValue(input.CopySourceIfModifiedSince),
            () => __dateToUtcString(input.CopySourceIfModifiedSince).toString(),
        ],
        "x-amz-copy-source-if-none-match": input.CopySourceIfNoneMatch,
        "x-amz-copy-source-if-unmodified-since": [
            () => isSerializableHeaderValue(input.CopySourceIfUnmodifiedSince),
            () => __dateToUtcString(input.CopySourceIfUnmodifiedSince).toString(),
        ],
        "x-amz-copy-source-range": input.CopySourceRange,
        "x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-server-side-encryption-customer-key": input.SSECustomerKey,
        "x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-copy-source-server-side-encryption-customer-algorithm": input.CopySourceSSECustomerAlgorithm,
        "x-amz-copy-source-server-side-encryption-customer-key": input.CopySourceSSECustomerKey,
        "x-amz-copy-source-server-side-encryption-customer-key-md5": input.CopySourceSSECustomerKeyMD5,
        "x-amz-request-payer": input.RequestPayer,
        "x-amz-expected-bucket-owner": input.ExpectedBucketOwner,
        "x-amz-source-expected-bucket-owner": input.ExpectedSourceBucketOwner,
    });
    let resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/{Key+}";
    resolvedPath = __resolvedPath(resolvedPath, input, "Bucket", () => input.Bucket, "{Bucket}", false);
    resolvedPath = __resolvedPath(resolvedPath, input, "Key", () => input.Key, "{Key+}", true);
    const query = map({
        "x-id": [, "UploadPartCopy"],
        partNumber: [__expectNonNull(input.PartNumber, `PartNumber`) != null, () => input.PartNumber.toString()],
        uploadId: [, __expectNonNull(input.UploadId, `UploadId`)],
    });
    let body;
    return new __HttpRequest({
        protocol,
        hostname,
        port,
        method: "PUT",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const se_WriteGetObjectResponseCommand = async (input, context) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const headers = map({}, isSerializableHeaderValue, {
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        "content-type": "application/octet-stream",
        "x-amz-request-route": input.RequestRoute,
        "x-amz-request-token": input.RequestToken,
        "x-amz-fwd-status": [() => isSerializableHeaderValue(input.StatusCode), () => input.StatusCode.toString()],
        "x-amz-fwd-error-code": input.ErrorCode,
        "x-amz-fwd-error-message": input.ErrorMessage,
        "x-amz-fwd-header-accept-ranges": input.AcceptRanges,
        "x-amz-fwd-header-cache-control": input.CacheControl,
        "x-amz-fwd-header-content-disposition": input.ContentDisposition,
        "x-amz-fwd-header-content-encoding": input.ContentEncoding,
        "x-amz-fwd-header-content-language": input.ContentLanguage,
        "content-length": [() => isSerializableHeaderValue(input.ContentLength), () => input.ContentLength.toString()],
        "x-amz-fwd-header-content-range": input.ContentRange,
        "x-amz-fwd-header-content-type": input.ContentType,
        "x-amz-fwd-header-x-amz-checksum-crc32": input.ChecksumCRC32,
        "x-amz-fwd-header-x-amz-checksum-crc32c": input.ChecksumCRC32C,
        "x-amz-fwd-header-x-amz-checksum-sha1": input.ChecksumSHA1,
        "x-amz-fwd-header-x-amz-checksum-sha256": input.ChecksumSHA256,
        "x-amz-fwd-header-x-amz-delete-marker": [
            () => isSerializableHeaderValue(input.DeleteMarker),
            () => input.DeleteMarker.toString(),
        ],
        "x-amz-fwd-header-etag": input.ETag,
        "x-amz-fwd-header-expires": [
            () => isSerializableHeaderValue(input.Expires),
            () => __dateToUtcString(input.Expires).toString(),
        ],
        "x-amz-fwd-header-x-amz-expiration": input.Expiration,
        "x-amz-fwd-header-last-modified": [
            () => isSerializableHeaderValue(input.LastModified),
            () => __dateToUtcString(input.LastModified).toString(),
        ],
        "x-amz-fwd-header-x-amz-missing-meta": [
            () => isSerializableHeaderValue(input.MissingMeta),
            () => input.MissingMeta.toString(),
        ],
        "x-amz-fwd-header-x-amz-object-lock-mode": input.ObjectLockMode,
        "x-amz-fwd-header-x-amz-object-lock-legal-hold": input.ObjectLockLegalHoldStatus,
        "x-amz-fwd-header-x-amz-object-lock-retain-until-date": [
            () => isSerializableHeaderValue(input.ObjectLockRetainUntilDate),
            () => (input.ObjectLockRetainUntilDate.toISOString().split(".")[0] + "Z").toString(),
        ],
        "x-amz-fwd-header-x-amz-mp-parts-count": [
            () => isSerializableHeaderValue(input.PartsCount),
            () => input.PartsCount.toString(),
        ],
        "x-amz-fwd-header-x-amz-replication-status": input.ReplicationStatus,
        "x-amz-fwd-header-x-amz-request-charged": input.RequestCharged,
        "x-amz-fwd-header-x-amz-restore": input.Restore,
        "x-amz-fwd-header-x-amz-server-side-encryption": input.ServerSideEncryption,
        "x-amz-fwd-header-x-amz-server-side-encryption-customer-algorithm": input.SSECustomerAlgorithm,
        "x-amz-fwd-header-x-amz-server-side-encryption-aws-kms-key-id": input.SSEKMSKeyId,
        "x-amz-fwd-header-x-amz-server-side-encryption-customer-key-md5": input.SSECustomerKeyMD5,
        "x-amz-fwd-header-x-amz-storage-class": input.StorageClass,
        "x-amz-fwd-header-x-amz-tagging-count": [
            () => isSerializableHeaderValue(input.TagCount),
            () => input.TagCount.toString(),
        ],
        "x-amz-fwd-header-x-amz-version-id": input.VersionId,
        "x-amz-fwd-header-x-amz-server-side-encryption-bucket-key-enabled": [
            () => isSerializableHeaderValue(input.BucketKeyEnabled),
            () => input.BucketKeyEnabled.toString(),
        ],
        ...(input.Metadata !== undefined &&
            Object.keys(input.Metadata).reduce((acc, suffix) => {
                acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
                return acc;
            }, {})),
    });
    const resolvedPath = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + "/WriteGetObjectResponse";
    const query = map({
        "x-id": [, "WriteGetObjectResponse"],
    });
    let body;
    if (input.Body !== undefined) {
        body = input.Body;
    }
    let contents;
    if (input.Body !== undefined) {
        contents = input.Body;
        body = contents;
    }
    let { hostname: resolvedHostname } = await context.endpoint();
    if (context.disableHostPrefix !== true) {
        resolvedHostname = "{RequestRoute}." + resolvedHostname;
        if (input.RequestRoute === undefined) {
            throw new Error("Empty value provided for input host prefix: RequestRoute.");
        }
        resolvedHostname = resolvedHostname.replace("{RequestRoute}", input.RequestRoute);
        if (!__isValidHostname(resolvedHostname)) {
            throw new Error("ValidationError: prefixed hostname must be hostname compatible.");
        }
    }
    return new __HttpRequest({
        protocol,
        hostname: resolvedHostname,
        port,
        method: "POST",
        headers,
        path: resolvedPath,
        query,
        body,
    });
};
export const de_AbortMultipartUploadCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_AbortMultipartUploadCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_AbortMultipartUploadCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchUpload":
        case "com.amazonaws.s3#NoSuchUpload":
            throw await de_NoSuchUploadRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_CompleteMultipartUploadCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CompleteMultipartUploadCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        Expiration: [, output.headers["x-amz-expiration"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        VersionId: [, output.headers["x-amz-version-id"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Bucket"] !== undefined) {
        contents.Bucket = __expectString(data["Bucket"]);
    }
    if (data["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(data["ChecksumCRC32"]);
    }
    if (data["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(data["ChecksumCRC32C"]);
    }
    if (data["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(data["ChecksumSHA1"]);
    }
    if (data["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(data["ChecksumSHA256"]);
    }
    if (data["ETag"] !== undefined) {
        contents.ETag = __expectString(data["ETag"]);
    }
    if (data["Key"] !== undefined) {
        contents.Key = __expectString(data["Key"]);
    }
    if (data["Location"] !== undefined) {
        contents.Location = __expectString(data["Location"]);
    }
    return contents;
};
const de_CompleteMultipartUploadCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_CopyObjectCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CopyObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        Expiration: [, output.headers["x-amz-expiration"]],
        CopySourceVersionId: [, output.headers["x-amz-copy-source-version-id"]],
        VersionId: [, output.headers["x-amz-version-id"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        SSEKMSEncryptionContext: [, output.headers["x-amz-server-side-encryption-context"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.CopyObjectResult = de_CopyObjectResult(data, context);
    return contents;
};
const de_CopyObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "ObjectNotInActiveTierError":
        case "com.amazonaws.s3#ObjectNotInActiveTierError":
            throw await de_ObjectNotInActiveTierErrorRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_CreateBucketCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CreateBucketCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        Location: [, output.headers["location"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_CreateBucketCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "BucketAlreadyExists":
        case "com.amazonaws.s3#BucketAlreadyExists":
            throw await de_BucketAlreadyExistsRes(parsedOutput, context);
        case "BucketAlreadyOwnedByYou":
        case "com.amazonaws.s3#BucketAlreadyOwnedByYou":
            throw await de_BucketAlreadyOwnedByYouRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_CreateMultipartUploadCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CreateMultipartUploadCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        AbortDate: [
            () => void 0 !== output.headers["x-amz-abort-date"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["x-amz-abort-date"])),
        ],
        AbortRuleId: [, output.headers["x-amz-abort-rule-id"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        SSEKMSEncryptionContext: [, output.headers["x-amz-server-side-encryption-context"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
        ChecksumAlgorithm: [, output.headers["x-amz-checksum-algorithm"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Bucket"] !== undefined) {
        contents.Bucket = __expectString(data["Bucket"]);
    }
    if (data["Key"] !== undefined) {
        contents.Key = __expectString(data["Key"]);
    }
    if (data["UploadId"] !== undefined) {
        contents.UploadId = __expectString(data["UploadId"]);
    }
    return contents;
};
const de_CreateMultipartUploadCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketAnalyticsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketAnalyticsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketAnalyticsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketCorsCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketCorsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketCorsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketEncryptionCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketEncryptionCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketEncryptionCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketIntelligentTieringConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketIntelligentTieringConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketIntelligentTieringConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketInventoryConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketInventoryConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketInventoryConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketLifecycleCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketLifecycleCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketLifecycleCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketMetricsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketMetricsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketMetricsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketOwnershipControlsCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketOwnershipControlsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketOwnershipControlsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketPolicyCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketPolicyCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketPolicyCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketReplicationCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketReplicationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketReplicationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketTaggingCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteBucketWebsiteCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteBucketWebsiteCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteBucketWebsiteCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteObjectCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        DeleteMarker: [
            () => void 0 !== output.headers["x-amz-delete-marker"],
            () => __parseBoolean(output.headers["x-amz-delete-marker"]),
        ],
        VersionId: [, output.headers["x-amz-version-id"]],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteObjectsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_DeleteObjectsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.Deleted === "") {
        contents.Deleted = [];
    }
    else if (data["Deleted"] !== undefined) {
        contents.Deleted = de_DeletedObjects(__getArrayIfSingleItem(data["Deleted"]), context);
    }
    if (data.Error === "") {
        contents.Errors = [];
    }
    else if (data["Error"] !== undefined) {
        contents.Errors = de_Errors(__getArrayIfSingleItem(data["Error"]), context);
    }
    return contents;
};
const de_DeleteObjectsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeleteObjectTaggingCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeleteObjectTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        VersionId: [, output.headers["x-amz-version-id"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeleteObjectTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_DeletePublicAccessBlockCommand = async (output, context) => {
    if (output.statusCode !== 204 && output.statusCode >= 300) {
        return de_DeletePublicAccessBlockCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_DeletePublicAccessBlockCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketAccelerateConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketAccelerateConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Status"] !== undefined) {
        contents.Status = __expectString(data["Status"]);
    }
    return contents;
};
const de_GetBucketAccelerateConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketAclCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketAclCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.AccessControlList === "") {
        contents.Grants = [];
    }
    else if (data["AccessControlList"] !== undefined && data["AccessControlList"]["Grant"] !== undefined) {
        contents.Grants = de_Grants(__getArrayIfSingleItem(data["AccessControlList"]["Grant"]), context);
    }
    if (data["Owner"] !== undefined) {
        contents.Owner = de_Owner(data["Owner"], context);
    }
    return contents;
};
const de_GetBucketAclCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketAnalyticsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketAnalyticsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.AnalyticsConfiguration = de_AnalyticsConfiguration(data, context);
    return contents;
};
const de_GetBucketAnalyticsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketCorsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketCorsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.CORSRule === "") {
        contents.CORSRules = [];
    }
    else if (data["CORSRule"] !== undefined) {
        contents.CORSRules = de_CORSRules(__getArrayIfSingleItem(data["CORSRule"]), context);
    }
    return contents;
};
const de_GetBucketCorsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketEncryptionCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketEncryptionCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.ServerSideEncryptionConfiguration = de_ServerSideEncryptionConfiguration(data, context);
    return contents;
};
const de_GetBucketEncryptionCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketIntelligentTieringConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketIntelligentTieringConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.IntelligentTieringConfiguration = de_IntelligentTieringConfiguration(data, context);
    return contents;
};
const de_GetBucketIntelligentTieringConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketInventoryConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketInventoryConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.InventoryConfiguration = de_InventoryConfiguration(data, context);
    return contents;
};
const de_GetBucketInventoryConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketLifecycleConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketLifecycleConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.Rule === "") {
        contents.Rules = [];
    }
    else if (data["Rule"] !== undefined) {
        contents.Rules = de_LifecycleRules(__getArrayIfSingleItem(data["Rule"]), context);
    }
    return contents;
};
const de_GetBucketLifecycleConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketLocationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketLocationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["LocationConstraint"] !== undefined) {
        contents.LocationConstraint = __expectString(data["LocationConstraint"]);
    }
    return contents;
};
const de_GetBucketLocationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketLoggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketLoggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["LoggingEnabled"] !== undefined) {
        contents.LoggingEnabled = de_LoggingEnabled(data["LoggingEnabled"], context);
    }
    return contents;
};
const de_GetBucketLoggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketMetricsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketMetricsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.MetricsConfiguration = de_MetricsConfiguration(data, context);
    return contents;
};
const de_GetBucketMetricsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketNotificationConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketNotificationConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["EventBridgeConfiguration"] !== undefined) {
        contents.EventBridgeConfiguration = de_EventBridgeConfiguration(data["EventBridgeConfiguration"], context);
    }
    if (data.CloudFunctionConfiguration === "") {
        contents.LambdaFunctionConfigurations = [];
    }
    else if (data["CloudFunctionConfiguration"] !== undefined) {
        contents.LambdaFunctionConfigurations = de_LambdaFunctionConfigurationList(__getArrayIfSingleItem(data["CloudFunctionConfiguration"]), context);
    }
    if (data.QueueConfiguration === "") {
        contents.QueueConfigurations = [];
    }
    else if (data["QueueConfiguration"] !== undefined) {
        contents.QueueConfigurations = de_QueueConfigurationList(__getArrayIfSingleItem(data["QueueConfiguration"]), context);
    }
    if (data.TopicConfiguration === "") {
        contents.TopicConfigurations = [];
    }
    else if (data["TopicConfiguration"] !== undefined) {
        contents.TopicConfigurations = de_TopicConfigurationList(__getArrayIfSingleItem(data["TopicConfiguration"]), context);
    }
    return contents;
};
const de_GetBucketNotificationConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketOwnershipControlsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketOwnershipControlsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.OwnershipControls = de_OwnershipControls(data, context);
    return contents;
};
const de_GetBucketOwnershipControlsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketPolicyCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketPolicyCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = await collectBodyString(output.body, context);
    contents.Policy = __expectString(data);
    return contents;
};
const de_GetBucketPolicyCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketPolicyStatusCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketPolicyStatusCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.PolicyStatus = de_PolicyStatus(data, context);
    return contents;
};
const de_GetBucketPolicyStatusCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketReplicationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketReplicationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.ReplicationConfiguration = de_ReplicationConfiguration(data, context);
    return contents;
};
const de_GetBucketReplicationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketRequestPaymentCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketRequestPaymentCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Payer"] !== undefined) {
        contents.Payer = __expectString(data["Payer"]);
    }
    return contents;
};
const de_GetBucketRequestPaymentCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketTaggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.TagSet === "") {
        contents.TagSet = [];
    }
    else if (data["TagSet"] !== undefined && data["TagSet"]["Tag"] !== undefined) {
        contents.TagSet = de_TagSet(__getArrayIfSingleItem(data["TagSet"]["Tag"]), context);
    }
    return contents;
};
const de_GetBucketTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketVersioningCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketVersioningCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["MfaDelete"] !== undefined) {
        contents.MFADelete = __expectString(data["MfaDelete"]);
    }
    if (data["Status"] !== undefined) {
        contents.Status = __expectString(data["Status"]);
    }
    return contents;
};
const de_GetBucketVersioningCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetBucketWebsiteCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetBucketWebsiteCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["ErrorDocument"] !== undefined) {
        contents.ErrorDocument = de_ErrorDocument(data["ErrorDocument"], context);
    }
    if (data["IndexDocument"] !== undefined) {
        contents.IndexDocument = de_IndexDocument(data["IndexDocument"], context);
    }
    if (data["RedirectAllRequestsTo"] !== undefined) {
        contents.RedirectAllRequestsTo = de_RedirectAllRequestsTo(data["RedirectAllRequestsTo"], context);
    }
    if (data.RoutingRules === "") {
        contents.RoutingRules = [];
    }
    else if (data["RoutingRules"] !== undefined && data["RoutingRules"]["RoutingRule"] !== undefined) {
        contents.RoutingRules = de_RoutingRules(__getArrayIfSingleItem(data["RoutingRules"]["RoutingRule"]), context);
    }
    return contents;
};
const de_GetBucketWebsiteCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetObjectCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        DeleteMarker: [
            () => void 0 !== output.headers["x-amz-delete-marker"],
            () => __parseBoolean(output.headers["x-amz-delete-marker"]),
        ],
        AcceptRanges: [, output.headers["accept-ranges"]],
        Expiration: [, output.headers["x-amz-expiration"]],
        Restore: [, output.headers["x-amz-restore"]],
        LastModified: [
            () => void 0 !== output.headers["last-modified"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["last-modified"])),
        ],
        ContentLength: [
            () => void 0 !== output.headers["content-length"],
            () => __strictParseLong(output.headers["content-length"]),
        ],
        ETag: [, output.headers["etag"]],
        ChecksumCRC32: [, output.headers["x-amz-checksum-crc32"]],
        ChecksumCRC32C: [, output.headers["x-amz-checksum-crc32c"]],
        ChecksumSHA1: [, output.headers["x-amz-checksum-sha1"]],
        ChecksumSHA256: [, output.headers["x-amz-checksum-sha256"]],
        MissingMeta: [
            () => void 0 !== output.headers["x-amz-missing-meta"],
            () => __strictParseInt32(output.headers["x-amz-missing-meta"]),
        ],
        VersionId: [, output.headers["x-amz-version-id"]],
        CacheControl: [, output.headers["cache-control"]],
        ContentDisposition: [, output.headers["content-disposition"]],
        ContentEncoding: [, output.headers["content-encoding"]],
        ContentLanguage: [, output.headers["content-language"]],
        ContentRange: [, output.headers["content-range"]],
        ContentType: [, output.headers["content-type"]],
        Expires: [
            () => void 0 !== output.headers["expires"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["expires"])),
        ],
        WebsiteRedirectLocation: [, output.headers["x-amz-website-redirect-location"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        StorageClass: [, output.headers["x-amz-storage-class"]],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
        ReplicationStatus: [, output.headers["x-amz-replication-status"]],
        PartsCount: [
            () => void 0 !== output.headers["x-amz-mp-parts-count"],
            () => __strictParseInt32(output.headers["x-amz-mp-parts-count"]),
        ],
        TagCount: [
            () => void 0 !== output.headers["x-amz-tagging-count"],
            () => __strictParseInt32(output.headers["x-amz-tagging-count"]),
        ],
        ObjectLockMode: [, output.headers["x-amz-object-lock-mode"]],
        ObjectLockRetainUntilDate: [
            () => void 0 !== output.headers["x-amz-object-lock-retain-until-date"],
            () => __expectNonNull(__parseRfc3339DateTimeWithOffset(output.headers["x-amz-object-lock-retain-until-date"])),
        ],
        ObjectLockLegalHoldStatus: [, output.headers["x-amz-object-lock-legal-hold"]],
        Metadata: [
            ,
            Object.keys(output.headers)
                .filter((header) => header.startsWith("x-amz-meta-"))
                .reduce((acc, header) => {
                acc[header.substring(11)] = output.headers[header];
                return acc;
            }, {}),
        ],
    });
    const data = output.body;
    context.sdkStreamMixin(data);
    contents.Body = data;
    return contents;
};
const de_GetObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "InvalidObjectState":
        case "com.amazonaws.s3#InvalidObjectState":
            throw await de_InvalidObjectStateRes(parsedOutput, context);
        case "NoSuchKey":
        case "com.amazonaws.s3#NoSuchKey":
            throw await de_NoSuchKeyRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_GetObjectAclCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectAclCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.AccessControlList === "") {
        contents.Grants = [];
    }
    else if (data["AccessControlList"] !== undefined && data["AccessControlList"]["Grant"] !== undefined) {
        contents.Grants = de_Grants(__getArrayIfSingleItem(data["AccessControlList"]["Grant"]), context);
    }
    if (data["Owner"] !== undefined) {
        contents.Owner = de_Owner(data["Owner"], context);
    }
    return contents;
};
const de_GetObjectAclCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchKey":
        case "com.amazonaws.s3#NoSuchKey":
            throw await de_NoSuchKeyRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_GetObjectAttributesCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectAttributesCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        DeleteMarker: [
            () => void 0 !== output.headers["x-amz-delete-marker"],
            () => __parseBoolean(output.headers["x-amz-delete-marker"]),
        ],
        LastModified: [
            () => void 0 !== output.headers["last-modified"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["last-modified"])),
        ],
        VersionId: [, output.headers["x-amz-version-id"]],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Checksum"] !== undefined) {
        contents.Checksum = de_Checksum(data["Checksum"], context);
    }
    if (data["ETag"] !== undefined) {
        contents.ETag = __expectString(data["ETag"]);
    }
    if (data["ObjectParts"] !== undefined) {
        contents.ObjectParts = de_GetObjectAttributesParts(data["ObjectParts"], context);
    }
    if (data["ObjectSize"] !== undefined) {
        contents.ObjectSize = __strictParseLong(data["ObjectSize"]);
    }
    if (data["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(data["StorageClass"]);
    }
    return contents;
};
const de_GetObjectAttributesCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchKey":
        case "com.amazonaws.s3#NoSuchKey":
            throw await de_NoSuchKeyRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_GetObjectLegalHoldCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectLegalHoldCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.LegalHold = de_ObjectLockLegalHold(data, context);
    return contents;
};
const de_GetObjectLegalHoldCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetObjectLockConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectLockConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.ObjectLockConfiguration = de_ObjectLockConfiguration(data, context);
    return contents;
};
const de_GetObjectLockConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetObjectRetentionCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectRetentionCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.Retention = de_ObjectLockRetention(data, context);
    return contents;
};
const de_GetObjectRetentionCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetObjectTaggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        VersionId: [, output.headers["x-amz-version-id"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.TagSet === "") {
        contents.TagSet = [];
    }
    else if (data["TagSet"] !== undefined && data["TagSet"]["Tag"] !== undefined) {
        contents.TagSet = de_TagSet(__getArrayIfSingleItem(data["TagSet"]["Tag"]), context);
    }
    return contents;
};
const de_GetObjectTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetObjectTorrentCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetObjectTorrentCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = output.body;
    context.sdkStreamMixin(data);
    contents.Body = data;
    return contents;
};
const de_GetObjectTorrentCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_GetPublicAccessBlockCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_GetPublicAccessBlockCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.PublicAccessBlockConfiguration = de_PublicAccessBlockConfiguration(data, context);
    return contents;
};
const de_GetPublicAccessBlockCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_HeadBucketCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_HeadBucketCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_HeadBucketCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NotFound":
        case "com.amazonaws.s3#NotFound":
            throw await de_NotFoundRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_HeadObjectCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_HeadObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        DeleteMarker: [
            () => void 0 !== output.headers["x-amz-delete-marker"],
            () => __parseBoolean(output.headers["x-amz-delete-marker"]),
        ],
        AcceptRanges: [, output.headers["accept-ranges"]],
        Expiration: [, output.headers["x-amz-expiration"]],
        Restore: [, output.headers["x-amz-restore"]],
        ArchiveStatus: [, output.headers["x-amz-archive-status"]],
        LastModified: [
            () => void 0 !== output.headers["last-modified"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["last-modified"])),
        ],
        ContentLength: [
            () => void 0 !== output.headers["content-length"],
            () => __strictParseLong(output.headers["content-length"]),
        ],
        ChecksumCRC32: [, output.headers["x-amz-checksum-crc32"]],
        ChecksumCRC32C: [, output.headers["x-amz-checksum-crc32c"]],
        ChecksumSHA1: [, output.headers["x-amz-checksum-sha1"]],
        ChecksumSHA256: [, output.headers["x-amz-checksum-sha256"]],
        ETag: [, output.headers["etag"]],
        MissingMeta: [
            () => void 0 !== output.headers["x-amz-missing-meta"],
            () => __strictParseInt32(output.headers["x-amz-missing-meta"]),
        ],
        VersionId: [, output.headers["x-amz-version-id"]],
        CacheControl: [, output.headers["cache-control"]],
        ContentDisposition: [, output.headers["content-disposition"]],
        ContentEncoding: [, output.headers["content-encoding"]],
        ContentLanguage: [, output.headers["content-language"]],
        ContentType: [, output.headers["content-type"]],
        Expires: [
            () => void 0 !== output.headers["expires"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["expires"])),
        ],
        WebsiteRedirectLocation: [, output.headers["x-amz-website-redirect-location"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        StorageClass: [, output.headers["x-amz-storage-class"]],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
        ReplicationStatus: [, output.headers["x-amz-replication-status"]],
        PartsCount: [
            () => void 0 !== output.headers["x-amz-mp-parts-count"],
            () => __strictParseInt32(output.headers["x-amz-mp-parts-count"]),
        ],
        ObjectLockMode: [, output.headers["x-amz-object-lock-mode"]],
        ObjectLockRetainUntilDate: [
            () => void 0 !== output.headers["x-amz-object-lock-retain-until-date"],
            () => __expectNonNull(__parseRfc3339DateTimeWithOffset(output.headers["x-amz-object-lock-retain-until-date"])),
        ],
        ObjectLockLegalHoldStatus: [, output.headers["x-amz-object-lock-legal-hold"]],
        Metadata: [
            ,
            Object.keys(output.headers)
                .filter((header) => header.startsWith("x-amz-meta-"))
                .reduce((acc, header) => {
                acc[header.substring(11)] = output.headers[header];
                return acc;
            }, {}),
        ],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_HeadObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NotFound":
        case "com.amazonaws.s3#NotFound":
            throw await de_NotFoundRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_ListBucketAnalyticsConfigurationsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListBucketAnalyticsConfigurationsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.AnalyticsConfiguration === "") {
        contents.AnalyticsConfigurationList = [];
    }
    else if (data["AnalyticsConfiguration"] !== undefined) {
        contents.AnalyticsConfigurationList = de_AnalyticsConfigurationList(__getArrayIfSingleItem(data["AnalyticsConfiguration"]), context);
    }
    if (data["ContinuationToken"] !== undefined) {
        contents.ContinuationToken = __expectString(data["ContinuationToken"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["NextContinuationToken"] !== undefined) {
        contents.NextContinuationToken = __expectString(data["NextContinuationToken"]);
    }
    return contents;
};
const de_ListBucketAnalyticsConfigurationsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListBucketIntelligentTieringConfigurationsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListBucketIntelligentTieringConfigurationsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["ContinuationToken"] !== undefined) {
        contents.ContinuationToken = __expectString(data["ContinuationToken"]);
    }
    if (data.IntelligentTieringConfiguration === "") {
        contents.IntelligentTieringConfigurationList = [];
    }
    else if (data["IntelligentTieringConfiguration"] !== undefined) {
        contents.IntelligentTieringConfigurationList = de_IntelligentTieringConfigurationList(__getArrayIfSingleItem(data["IntelligentTieringConfiguration"]), context);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["NextContinuationToken"] !== undefined) {
        contents.NextContinuationToken = __expectString(data["NextContinuationToken"]);
    }
    return contents;
};
const de_ListBucketIntelligentTieringConfigurationsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListBucketInventoryConfigurationsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListBucketInventoryConfigurationsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["ContinuationToken"] !== undefined) {
        contents.ContinuationToken = __expectString(data["ContinuationToken"]);
    }
    if (data.InventoryConfiguration === "") {
        contents.InventoryConfigurationList = [];
    }
    else if (data["InventoryConfiguration"] !== undefined) {
        contents.InventoryConfigurationList = de_InventoryConfigurationList(__getArrayIfSingleItem(data["InventoryConfiguration"]), context);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["NextContinuationToken"] !== undefined) {
        contents.NextContinuationToken = __expectString(data["NextContinuationToken"]);
    }
    return contents;
};
const de_ListBucketInventoryConfigurationsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListBucketMetricsConfigurationsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListBucketMetricsConfigurationsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["ContinuationToken"] !== undefined) {
        contents.ContinuationToken = __expectString(data["ContinuationToken"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data.MetricsConfiguration === "") {
        contents.MetricsConfigurationList = [];
    }
    else if (data["MetricsConfiguration"] !== undefined) {
        contents.MetricsConfigurationList = de_MetricsConfigurationList(__getArrayIfSingleItem(data["MetricsConfiguration"]), context);
    }
    if (data["NextContinuationToken"] !== undefined) {
        contents.NextContinuationToken = __expectString(data["NextContinuationToken"]);
    }
    return contents;
};
const de_ListBucketMetricsConfigurationsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListBucketsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListBucketsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.Buckets === "") {
        contents.Buckets = [];
    }
    else if (data["Buckets"] !== undefined && data["Buckets"]["Bucket"] !== undefined) {
        contents.Buckets = de_Buckets(__getArrayIfSingleItem(data["Buckets"]["Bucket"]), context);
    }
    if (data["Owner"] !== undefined) {
        contents.Owner = de_Owner(data["Owner"], context);
    }
    return contents;
};
const de_ListBucketsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListMultipartUploadsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListMultipartUploadsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Bucket"] !== undefined) {
        contents.Bucket = __expectString(data["Bucket"]);
    }
    if (data.CommonPrefixes === "") {
        contents.CommonPrefixes = [];
    }
    else if (data["CommonPrefixes"] !== undefined) {
        contents.CommonPrefixes = de_CommonPrefixList(__getArrayIfSingleItem(data["CommonPrefixes"]), context);
    }
    if (data["Delimiter"] !== undefined) {
        contents.Delimiter = __expectString(data["Delimiter"]);
    }
    if (data["EncodingType"] !== undefined) {
        contents.EncodingType = __expectString(data["EncodingType"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["KeyMarker"] !== undefined) {
        contents.KeyMarker = __expectString(data["KeyMarker"]);
    }
    if (data["MaxUploads"] !== undefined) {
        contents.MaxUploads = __strictParseInt32(data["MaxUploads"]);
    }
    if (data["NextKeyMarker"] !== undefined) {
        contents.NextKeyMarker = __expectString(data["NextKeyMarker"]);
    }
    if (data["NextUploadIdMarker"] !== undefined) {
        contents.NextUploadIdMarker = __expectString(data["NextUploadIdMarker"]);
    }
    if (data["Prefix"] !== undefined) {
        contents.Prefix = __expectString(data["Prefix"]);
    }
    if (data["UploadIdMarker"] !== undefined) {
        contents.UploadIdMarker = __expectString(data["UploadIdMarker"]);
    }
    if (data.Upload === "") {
        contents.Uploads = [];
    }
    else if (data["Upload"] !== undefined) {
        contents.Uploads = de_MultipartUploadList(__getArrayIfSingleItem(data["Upload"]), context);
    }
    return contents;
};
const de_ListMultipartUploadsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListObjectsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListObjectsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.CommonPrefixes === "") {
        contents.CommonPrefixes = [];
    }
    else if (data["CommonPrefixes"] !== undefined) {
        contents.CommonPrefixes = de_CommonPrefixList(__getArrayIfSingleItem(data["CommonPrefixes"]), context);
    }
    if (data.Contents === "") {
        contents.Contents = [];
    }
    else if (data["Contents"] !== undefined) {
        contents.Contents = de_ObjectList(__getArrayIfSingleItem(data["Contents"]), context);
    }
    if (data["Delimiter"] !== undefined) {
        contents.Delimiter = __expectString(data["Delimiter"]);
    }
    if (data["EncodingType"] !== undefined) {
        contents.EncodingType = __expectString(data["EncodingType"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["Marker"] !== undefined) {
        contents.Marker = __expectString(data["Marker"]);
    }
    if (data["MaxKeys"] !== undefined) {
        contents.MaxKeys = __strictParseInt32(data["MaxKeys"]);
    }
    if (data["Name"] !== undefined) {
        contents.Name = __expectString(data["Name"]);
    }
    if (data["NextMarker"] !== undefined) {
        contents.NextMarker = __expectString(data["NextMarker"]);
    }
    if (data["Prefix"] !== undefined) {
        contents.Prefix = __expectString(data["Prefix"]);
    }
    return contents;
};
const de_ListObjectsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchBucket":
        case "com.amazonaws.s3#NoSuchBucket":
            throw await de_NoSuchBucketRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_ListObjectsV2Command = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListObjectsV2CommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.CommonPrefixes === "") {
        contents.CommonPrefixes = [];
    }
    else if (data["CommonPrefixes"] !== undefined) {
        contents.CommonPrefixes = de_CommonPrefixList(__getArrayIfSingleItem(data["CommonPrefixes"]), context);
    }
    if (data.Contents === "") {
        contents.Contents = [];
    }
    else if (data["Contents"] !== undefined) {
        contents.Contents = de_ObjectList(__getArrayIfSingleItem(data["Contents"]), context);
    }
    if (data["ContinuationToken"] !== undefined) {
        contents.ContinuationToken = __expectString(data["ContinuationToken"]);
    }
    if (data["Delimiter"] !== undefined) {
        contents.Delimiter = __expectString(data["Delimiter"]);
    }
    if (data["EncodingType"] !== undefined) {
        contents.EncodingType = __expectString(data["EncodingType"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["KeyCount"] !== undefined) {
        contents.KeyCount = __strictParseInt32(data["KeyCount"]);
    }
    if (data["MaxKeys"] !== undefined) {
        contents.MaxKeys = __strictParseInt32(data["MaxKeys"]);
    }
    if (data["Name"] !== undefined) {
        contents.Name = __expectString(data["Name"]);
    }
    if (data["NextContinuationToken"] !== undefined) {
        contents.NextContinuationToken = __expectString(data["NextContinuationToken"]);
    }
    if (data["Prefix"] !== undefined) {
        contents.Prefix = __expectString(data["Prefix"]);
    }
    if (data["StartAfter"] !== undefined) {
        contents.StartAfter = __expectString(data["StartAfter"]);
    }
    return contents;
};
const de_ListObjectsV2CommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchBucket":
        case "com.amazonaws.s3#NoSuchBucket":
            throw await de_NoSuchBucketRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_ListObjectVersionsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListObjectVersionsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data.CommonPrefixes === "") {
        contents.CommonPrefixes = [];
    }
    else if (data["CommonPrefixes"] !== undefined) {
        contents.CommonPrefixes = de_CommonPrefixList(__getArrayIfSingleItem(data["CommonPrefixes"]), context);
    }
    if (data.DeleteMarker === "") {
        contents.DeleteMarkers = [];
    }
    else if (data["DeleteMarker"] !== undefined) {
        contents.DeleteMarkers = de_DeleteMarkers(__getArrayIfSingleItem(data["DeleteMarker"]), context);
    }
    if (data["Delimiter"] !== undefined) {
        contents.Delimiter = __expectString(data["Delimiter"]);
    }
    if (data["EncodingType"] !== undefined) {
        contents.EncodingType = __expectString(data["EncodingType"]);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["KeyMarker"] !== undefined) {
        contents.KeyMarker = __expectString(data["KeyMarker"]);
    }
    if (data["MaxKeys"] !== undefined) {
        contents.MaxKeys = __strictParseInt32(data["MaxKeys"]);
    }
    if (data["Name"] !== undefined) {
        contents.Name = __expectString(data["Name"]);
    }
    if (data["NextKeyMarker"] !== undefined) {
        contents.NextKeyMarker = __expectString(data["NextKeyMarker"]);
    }
    if (data["NextVersionIdMarker"] !== undefined) {
        contents.NextVersionIdMarker = __expectString(data["NextVersionIdMarker"]);
    }
    if (data["Prefix"] !== undefined) {
        contents.Prefix = __expectString(data["Prefix"]);
    }
    if (data["VersionIdMarker"] !== undefined) {
        contents.VersionIdMarker = __expectString(data["VersionIdMarker"]);
    }
    if (data.Version === "") {
        contents.Versions = [];
    }
    else if (data["Version"] !== undefined) {
        contents.Versions = de_ObjectVersionList(__getArrayIfSingleItem(data["Version"]), context);
    }
    return contents;
};
const de_ListObjectVersionsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_ListPartsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_ListPartsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        AbortDate: [
            () => void 0 !== output.headers["x-amz-abort-date"],
            () => __expectNonNull(__parseRfc7231DateTime(output.headers["x-amz-abort-date"])),
        ],
        AbortRuleId: [, output.headers["x-amz-abort-rule-id"]],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    if (data["Bucket"] !== undefined) {
        contents.Bucket = __expectString(data["Bucket"]);
    }
    if (data["ChecksumAlgorithm"] !== undefined) {
        contents.ChecksumAlgorithm = __expectString(data["ChecksumAlgorithm"]);
    }
    if (data["Initiator"] !== undefined) {
        contents.Initiator = de_Initiator(data["Initiator"], context);
    }
    if (data["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(data["IsTruncated"]);
    }
    if (data["Key"] !== undefined) {
        contents.Key = __expectString(data["Key"]);
    }
    if (data["MaxParts"] !== undefined) {
        contents.MaxParts = __strictParseInt32(data["MaxParts"]);
    }
    if (data["NextPartNumberMarker"] !== undefined) {
        contents.NextPartNumberMarker = __expectString(data["NextPartNumberMarker"]);
    }
    if (data["Owner"] !== undefined) {
        contents.Owner = de_Owner(data["Owner"], context);
    }
    if (data["PartNumberMarker"] !== undefined) {
        contents.PartNumberMarker = __expectString(data["PartNumberMarker"]);
    }
    if (data.Part === "") {
        contents.Parts = [];
    }
    else if (data["Part"] !== undefined) {
        contents.Parts = de_Parts(__getArrayIfSingleItem(data["Part"]), context);
    }
    if (data["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(data["StorageClass"]);
    }
    if (data["UploadId"] !== undefined) {
        contents.UploadId = __expectString(data["UploadId"]);
    }
    return contents;
};
const de_ListPartsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketAccelerateConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketAccelerateConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketAccelerateConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketAclCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketAclCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketAclCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketAnalyticsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketAnalyticsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketAnalyticsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketCorsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketCorsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketCorsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketEncryptionCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketEncryptionCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketEncryptionCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketIntelligentTieringConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketIntelligentTieringConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketIntelligentTieringConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketInventoryConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketInventoryConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketInventoryConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketLifecycleConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketLifecycleConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketLifecycleConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketLoggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketLoggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketLoggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketMetricsConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketMetricsConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketMetricsConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketNotificationConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketNotificationConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketNotificationConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketOwnershipControlsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketOwnershipControlsCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketOwnershipControlsCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketPolicyCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketPolicyCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketPolicyCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketReplicationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketReplicationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketReplicationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketRequestPaymentCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketRequestPaymentCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketRequestPaymentCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketTaggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketVersioningCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketVersioningCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketVersioningCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutBucketWebsiteCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutBucketWebsiteCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutBucketWebsiteCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutObjectCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        Expiration: [, output.headers["x-amz-expiration"]],
        ETag: [, output.headers["etag"]],
        ChecksumCRC32: [, output.headers["x-amz-checksum-crc32"]],
        ChecksumCRC32C: [, output.headers["x-amz-checksum-crc32c"]],
        ChecksumSHA1: [, output.headers["x-amz-checksum-sha1"]],
        ChecksumSHA256: [, output.headers["x-amz-checksum-sha256"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        VersionId: [, output.headers["x-amz-version-id"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        SSEKMSEncryptionContext: [, output.headers["x-amz-server-side-encryption-context"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutObjectAclCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectAclCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectAclCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "NoSuchKey":
        case "com.amazonaws.s3#NoSuchKey":
            throw await de_NoSuchKeyRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_PutObjectLegalHoldCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectLegalHoldCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectLegalHoldCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutObjectLockConfigurationCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectLockConfigurationCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectLockConfigurationCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutObjectRetentionCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectRetentionCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectRetentionCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutObjectTaggingCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutObjectTaggingCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        VersionId: [, output.headers["x-amz-version-id"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutObjectTaggingCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_PutPublicAccessBlockCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_PutPublicAccessBlockCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_PutPublicAccessBlockCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_RestoreObjectCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_RestoreObjectCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        RequestCharged: [, output.headers["x-amz-request-charged"]],
        RestoreOutputPath: [, output.headers["x-amz-restore-output-path"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_RestoreObjectCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "ObjectAlreadyInActiveTierError":
        case "com.amazonaws.s3#ObjectAlreadyInActiveTierError":
            throw await de_ObjectAlreadyInActiveTierErrorRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
export const de_SelectObjectContentCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_SelectObjectContentCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = output.body;
    contents.Payload = de_SelectObjectContentEventStream(data, context);
    return contents;
};
const de_SelectObjectContentCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_UploadPartCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_UploadPartCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        ETag: [, output.headers["etag"]],
        ChecksumCRC32: [, output.headers["x-amz-checksum-crc32"]],
        ChecksumCRC32C: [, output.headers["x-amz-checksum-crc32c"]],
        ChecksumSHA1: [, output.headers["x-amz-checksum-sha1"]],
        ChecksumSHA256: [, output.headers["x-amz-checksum-sha256"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    await collectBody(output.body, context);
    return contents;
};
const de_UploadPartCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_UploadPartCopyCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_UploadPartCopyCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
        CopySourceVersionId: [, output.headers["x-amz-copy-source-version-id"]],
        ServerSideEncryption: [, output.headers["x-amz-server-side-encryption"]],
        SSECustomerAlgorithm: [, output.headers["x-amz-server-side-encryption-customer-algorithm"]],
        SSECustomerKeyMD5: [, output.headers["x-amz-server-side-encryption-customer-key-md5"]],
        SSEKMSKeyId: [, output.headers["x-amz-server-side-encryption-aws-kms-key-id"]],
        BucketKeyEnabled: [
            () => void 0 !== output.headers["x-amz-server-side-encryption-bucket-key-enabled"],
            () => __parseBoolean(output.headers["x-amz-server-side-encryption-bucket-key-enabled"]),
        ],
        RequestCharged: [, output.headers["x-amz-request-charged"]],
    });
    const data = __expectObject(await parseBody(output.body, context));
    contents.CopyPartResult = de_CopyPartResult(data, context);
    return contents;
};
const de_UploadPartCopyCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
export const de_WriteGetObjectResponseCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_WriteGetObjectResponseCommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_WriteGetObjectResponseCommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await parseErrorBody(output.body, context),
    };
    const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
    const parsedBody = parsedOutput.body;
    return throwDefaultError({
        output,
        parsedBody,
        errorCode,
    });
};
const throwDefaultError = withBaseException(__BaseException);
const de_BucketAlreadyExistsRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new BucketAlreadyExists({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_BucketAlreadyOwnedByYouRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new BucketAlreadyOwnedByYou({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_InvalidObjectStateRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    if (data["AccessTier"] !== undefined) {
        contents.AccessTier = __expectString(data["AccessTier"]);
    }
    if (data["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(data["StorageClass"]);
    }
    const exception = new InvalidObjectState({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_NoSuchBucketRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new NoSuchBucket({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_NoSuchKeyRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new NoSuchKey({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_NoSuchUploadRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new NoSuchUpload({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_NotFoundRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new NotFound({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_ObjectAlreadyInActiveTierErrorRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new ObjectAlreadyInActiveTierError({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_ObjectNotInActiveTierErrorRes = async (parsedOutput, context) => {
    const contents = map({});
    const data = parsedOutput.body;
    const exception = new ObjectNotInActiveTierError({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return __decorateServiceException(exception, parsedOutput.body);
};
const de_SelectObjectContentEventStream = (output, context) => {
    return context.eventStreamMarshaller.deserialize(output, async (event) => {
        if (event["Records"] != null) {
            return {
                Records: await de_RecordsEvent_event(event["Records"], context),
            };
        }
        if (event["Stats"] != null) {
            return {
                Stats: await de_StatsEvent_event(event["Stats"], context),
            };
        }
        if (event["Progress"] != null) {
            return {
                Progress: await de_ProgressEvent_event(event["Progress"], context),
            };
        }
        if (event["Cont"] != null) {
            return {
                Cont: await de_ContinuationEvent_event(event["Cont"], context),
            };
        }
        if (event["End"] != null) {
            return {
                End: await de_EndEvent_event(event["End"], context),
            };
        }
        return { $unknown: output };
    });
};
const de_ContinuationEvent_event = async (output, context) => {
    const contents = {};
    const data = await parseBody(output.body, context);
    Object.assign(contents, de_ContinuationEvent(data, context));
    return contents;
};
const de_EndEvent_event = async (output, context) => {
    const contents = {};
    const data = await parseBody(output.body, context);
    Object.assign(contents, de_EndEvent(data, context));
    return contents;
};
const de_ProgressEvent_event = async (output, context) => {
    const contents = {};
    const data = await parseBody(output.body, context);
    contents.Details = de_Progress(data, context);
    return contents;
};
const de_RecordsEvent_event = async (output, context) => {
    const contents = {};
    contents.Payload = output.body;
    return contents;
};
const de_StatsEvent_event = async (output, context) => {
    const contents = {};
    const data = await parseBody(output.body, context);
    contents.Details = de_Stats(data, context);
    return contents;
};
const se_AbortIncompleteMultipartUpload = (input, context) => {
    const bodyNode = new __XmlNode("AbortIncompleteMultipartUpload");
    if (input.DaysAfterInitiation != null) {
        const node = __XmlNode.of("DaysAfterInitiation", String(input.DaysAfterInitiation)).withName("DaysAfterInitiation");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AccelerateConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("AccelerateConfiguration");
    if (input.Status != null) {
        const node = __XmlNode.of("BucketAccelerateStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AccessControlPolicy = (input, context) => {
    const bodyNode = new __XmlNode("AccessControlPolicy");
    if (input.Grants != null) {
        const nodes = se_Grants(input.Grants, context);
        const containerNode = new __XmlNode("AccessControlList");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    if (input.Owner != null) {
        const node = se_Owner(input.Owner, context).withName("Owner");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AccessControlTranslation = (input, context) => {
    const bodyNode = new __XmlNode("AccessControlTranslation");
    if (input.Owner != null) {
        const node = __XmlNode.of("OwnerOverride", input.Owner).withName("Owner");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AllowedHeaders = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("AllowedHeader", entry);
        return node.withName("member");
    });
};
const se_AllowedMethods = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("AllowedMethod", entry);
        return node.withName("member");
    });
};
const se_AllowedOrigins = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("AllowedOrigin", entry);
        return node.withName("member");
    });
};
const se_AnalyticsAndOperator = (input, context) => {
    const bodyNode = new __XmlNode("AnalyticsAndOperator");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tags != null) {
        const nodes = se_TagSet(input.Tags, context);
        nodes.map((node) => {
            node = node.withName("Tag");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_AnalyticsConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("AnalyticsConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("AnalyticsId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_AnalyticsFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    if (input.StorageClassAnalysis != null) {
        const node = se_StorageClassAnalysis(input.StorageClassAnalysis, context).withName("StorageClassAnalysis");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AnalyticsExportDestination = (input, context) => {
    const bodyNode = new __XmlNode("AnalyticsExportDestination");
    if (input.S3BucketDestination != null) {
        const node = se_AnalyticsS3BucketDestination(input.S3BucketDestination, context).withName("S3BucketDestination");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_AnalyticsFilter = (input, context) => {
    const bodyNode = new __XmlNode("AnalyticsFilter");
    AnalyticsFilter.visit(input, {
        Prefix: (value) => {
            const node = __XmlNode.of("Prefix", value).withName("Prefix");
            bodyNode.addChildNode(node);
        },
        Tag: (value) => {
            const node = se_Tag(value, context).withName("Tag");
            bodyNode.addChildNode(node);
        },
        And: (value) => {
            const node = se_AnalyticsAndOperator(value, context).withName("And");
            bodyNode.addChildNode(node);
        },
        _: (name, value) => {
            if (!(value instanceof __XmlNode || value instanceof __XmlText)) {
                throw new Error("Unable to serialize unknown union members in XML.");
            }
            bodyNode.addChildNode(new __XmlNode(name).addChildNode(value));
        },
    });
    return bodyNode;
};
const se_AnalyticsS3BucketDestination = (input, context) => {
    const bodyNode = new __XmlNode("AnalyticsS3BucketDestination");
    if (input.Format != null) {
        const node = __XmlNode.of("AnalyticsS3ExportFileFormat", input.Format).withName("Format");
        bodyNode.addChildNode(node);
    }
    if (input.BucketAccountId != null) {
        const node = __XmlNode.of("AccountId", input.BucketAccountId).withName("BucketAccountId");
        bodyNode.addChildNode(node);
    }
    if (input.Bucket != null) {
        const node = __XmlNode.of("BucketName", input.Bucket).withName("Bucket");
        bodyNode.addChildNode(node);
    }
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_BucketLifecycleConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("BucketLifecycleConfiguration");
    if (input.Rules != null) {
        const nodes = se_LifecycleRules(input.Rules, context);
        nodes.map((node) => {
            node = node.withName("Rule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_BucketLoggingStatus = (input, context) => {
    const bodyNode = new __XmlNode("BucketLoggingStatus");
    if (input.LoggingEnabled != null) {
        const node = se_LoggingEnabled(input.LoggingEnabled, context).withName("LoggingEnabled");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CompletedMultipartUpload = (input, context) => {
    const bodyNode = new __XmlNode("CompletedMultipartUpload");
    if (input.Parts != null) {
        const nodes = se_CompletedPartList(input.Parts, context);
        nodes.map((node) => {
            node = node.withName("Part");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_CompletedPart = (input, context) => {
    const bodyNode = new __XmlNode("CompletedPart");
    if (input.ETag != null) {
        const node = __XmlNode.of("ETag", input.ETag).withName("ETag");
        bodyNode.addChildNode(node);
    }
    if (input.ChecksumCRC32 != null) {
        const node = __XmlNode.of("ChecksumCRC32", input.ChecksumCRC32).withName("ChecksumCRC32");
        bodyNode.addChildNode(node);
    }
    if (input.ChecksumCRC32C != null) {
        const node = __XmlNode.of("ChecksumCRC32C", input.ChecksumCRC32C).withName("ChecksumCRC32C");
        bodyNode.addChildNode(node);
    }
    if (input.ChecksumSHA1 != null) {
        const node = __XmlNode.of("ChecksumSHA1", input.ChecksumSHA1).withName("ChecksumSHA1");
        bodyNode.addChildNode(node);
    }
    if (input.ChecksumSHA256 != null) {
        const node = __XmlNode.of("ChecksumSHA256", input.ChecksumSHA256).withName("ChecksumSHA256");
        bodyNode.addChildNode(node);
    }
    if (input.PartNumber != null) {
        const node = __XmlNode.of("PartNumber", String(input.PartNumber)).withName("PartNumber");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CompletedPartList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_CompletedPart(entry, context);
        return node.withName("member");
    });
};
const se_Condition = (input, context) => {
    const bodyNode = new __XmlNode("Condition");
    if (input.HttpErrorCodeReturnedEquals != null) {
        const node = __XmlNode
            .of("HttpErrorCodeReturnedEquals", input.HttpErrorCodeReturnedEquals)
            .withName("HttpErrorCodeReturnedEquals");
        bodyNode.addChildNode(node);
    }
    if (input.KeyPrefixEquals != null) {
        const node = __XmlNode.of("KeyPrefixEquals", input.KeyPrefixEquals).withName("KeyPrefixEquals");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CORSConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("CORSConfiguration");
    if (input.CORSRules != null) {
        const nodes = se_CORSRules(input.CORSRules, context);
        nodes.map((node) => {
            node = node.withName("CORSRule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_CORSRule = (input, context) => {
    const bodyNode = new __XmlNode("CORSRule");
    if (input.ID != null) {
        const node = __XmlNode.of("ID", input.ID).withName("ID");
        bodyNode.addChildNode(node);
    }
    if (input.AllowedHeaders != null) {
        const nodes = se_AllowedHeaders(input.AllowedHeaders, context);
        nodes.map((node) => {
            node = node.withName("AllowedHeader");
            bodyNode.addChildNode(node);
        });
    }
    if (input.AllowedMethods != null) {
        const nodes = se_AllowedMethods(input.AllowedMethods, context);
        nodes.map((node) => {
            node = node.withName("AllowedMethod");
            bodyNode.addChildNode(node);
        });
    }
    if (input.AllowedOrigins != null) {
        const nodes = se_AllowedOrigins(input.AllowedOrigins, context);
        nodes.map((node) => {
            node = node.withName("AllowedOrigin");
            bodyNode.addChildNode(node);
        });
    }
    if (input.ExposeHeaders != null) {
        const nodes = se_ExposeHeaders(input.ExposeHeaders, context);
        nodes.map((node) => {
            node = node.withName("ExposeHeader");
            bodyNode.addChildNode(node);
        });
    }
    if (input.MaxAgeSeconds != null) {
        const node = __XmlNode.of("MaxAgeSeconds", String(input.MaxAgeSeconds)).withName("MaxAgeSeconds");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CORSRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_CORSRule(entry, context);
        return node.withName("member");
    });
};
const se_CreateBucketConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("CreateBucketConfiguration");
    if (input.LocationConstraint != null) {
        const node = __XmlNode.of("BucketLocationConstraint", input.LocationConstraint).withName("LocationConstraint");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CSVInput = (input, context) => {
    const bodyNode = new __XmlNode("CSVInput");
    if (input.FileHeaderInfo != null) {
        const node = __XmlNode.of("FileHeaderInfo", input.FileHeaderInfo).withName("FileHeaderInfo");
        bodyNode.addChildNode(node);
    }
    if (input.Comments != null) {
        const node = __XmlNode.of("Comments", input.Comments).withName("Comments");
        bodyNode.addChildNode(node);
    }
    if (input.QuoteEscapeCharacter != null) {
        const node = __XmlNode.of("QuoteEscapeCharacter", input.QuoteEscapeCharacter).withName("QuoteEscapeCharacter");
        bodyNode.addChildNode(node);
    }
    if (input.RecordDelimiter != null) {
        const node = __XmlNode.of("RecordDelimiter", input.RecordDelimiter).withName("RecordDelimiter");
        bodyNode.addChildNode(node);
    }
    if (input.FieldDelimiter != null) {
        const node = __XmlNode.of("FieldDelimiter", input.FieldDelimiter).withName("FieldDelimiter");
        bodyNode.addChildNode(node);
    }
    if (input.QuoteCharacter != null) {
        const node = __XmlNode.of("QuoteCharacter", input.QuoteCharacter).withName("QuoteCharacter");
        bodyNode.addChildNode(node);
    }
    if (input.AllowQuotedRecordDelimiter != null) {
        const node = __XmlNode
            .of("AllowQuotedRecordDelimiter", String(input.AllowQuotedRecordDelimiter))
            .withName("AllowQuotedRecordDelimiter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_CSVOutput = (input, context) => {
    const bodyNode = new __XmlNode("CSVOutput");
    if (input.QuoteFields != null) {
        const node = __XmlNode.of("QuoteFields", input.QuoteFields).withName("QuoteFields");
        bodyNode.addChildNode(node);
    }
    if (input.QuoteEscapeCharacter != null) {
        const node = __XmlNode.of("QuoteEscapeCharacter", input.QuoteEscapeCharacter).withName("QuoteEscapeCharacter");
        bodyNode.addChildNode(node);
    }
    if (input.RecordDelimiter != null) {
        const node = __XmlNode.of("RecordDelimiter", input.RecordDelimiter).withName("RecordDelimiter");
        bodyNode.addChildNode(node);
    }
    if (input.FieldDelimiter != null) {
        const node = __XmlNode.of("FieldDelimiter", input.FieldDelimiter).withName("FieldDelimiter");
        bodyNode.addChildNode(node);
    }
    if (input.QuoteCharacter != null) {
        const node = __XmlNode.of("QuoteCharacter", input.QuoteCharacter).withName("QuoteCharacter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_DefaultRetention = (input, context) => {
    const bodyNode = new __XmlNode("DefaultRetention");
    if (input.Mode != null) {
        const node = __XmlNode.of("ObjectLockRetentionMode", input.Mode).withName("Mode");
        bodyNode.addChildNode(node);
    }
    if (input.Days != null) {
        const node = __XmlNode.of("Days", String(input.Days)).withName("Days");
        bodyNode.addChildNode(node);
    }
    if (input.Years != null) {
        const node = __XmlNode.of("Years", String(input.Years)).withName("Years");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Delete = (input, context) => {
    const bodyNode = new __XmlNode("Delete");
    if (input.Objects != null) {
        const nodes = se_ObjectIdentifierList(input.Objects, context);
        nodes.map((node) => {
            node = node.withName("Object");
            bodyNode.addChildNode(node);
        });
    }
    if (input.Quiet != null) {
        const node = __XmlNode.of("Quiet", String(input.Quiet)).withName("Quiet");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_DeleteMarkerReplication = (input, context) => {
    const bodyNode = new __XmlNode("DeleteMarkerReplication");
    if (input.Status != null) {
        const node = __XmlNode.of("DeleteMarkerReplicationStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Destination = (input, context) => {
    const bodyNode = new __XmlNode("Destination");
    if (input.Bucket != null) {
        const node = __XmlNode.of("BucketName", input.Bucket).withName("Bucket");
        bodyNode.addChildNode(node);
    }
    if (input.Account != null) {
        const node = __XmlNode.of("AccountId", input.Account).withName("Account");
        bodyNode.addChildNode(node);
    }
    if (input.StorageClass != null) {
        const node = __XmlNode.of("StorageClass", input.StorageClass).withName("StorageClass");
        bodyNode.addChildNode(node);
    }
    if (input.AccessControlTranslation != null) {
        const node = se_AccessControlTranslation(input.AccessControlTranslation, context).withName("AccessControlTranslation");
        bodyNode.addChildNode(node);
    }
    if (input.EncryptionConfiguration != null) {
        const node = se_EncryptionConfiguration(input.EncryptionConfiguration, context).withName("EncryptionConfiguration");
        bodyNode.addChildNode(node);
    }
    if (input.ReplicationTime != null) {
        const node = se_ReplicationTime(input.ReplicationTime, context).withName("ReplicationTime");
        bodyNode.addChildNode(node);
    }
    if (input.Metrics != null) {
        const node = se_Metrics(input.Metrics, context).withName("Metrics");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Encryption = (input, context) => {
    const bodyNode = new __XmlNode("Encryption");
    if (input.EncryptionType != null) {
        const node = __XmlNode.of("ServerSideEncryption", input.EncryptionType).withName("EncryptionType");
        bodyNode.addChildNode(node);
    }
    if (input.KMSKeyId != null) {
        const node = __XmlNode.of("SSEKMSKeyId", input.KMSKeyId).withName("KMSKeyId");
        bodyNode.addChildNode(node);
    }
    if (input.KMSContext != null) {
        const node = __XmlNode.of("KMSContext", input.KMSContext).withName("KMSContext");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_EncryptionConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("EncryptionConfiguration");
    if (input.ReplicaKmsKeyID != null) {
        const node = __XmlNode.of("ReplicaKmsKeyID", input.ReplicaKmsKeyID).withName("ReplicaKmsKeyID");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ErrorDocument = (input, context) => {
    const bodyNode = new __XmlNode("ErrorDocument");
    if (input.Key != null) {
        const node = __XmlNode.of("ObjectKey", input.Key).withName("Key");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_EventBridgeConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("EventBridgeConfiguration");
    return bodyNode;
};
const se_EventList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("Event", entry);
        return node.withName("member");
    });
};
const se_ExistingObjectReplication = (input, context) => {
    const bodyNode = new __XmlNode("ExistingObjectReplication");
    if (input.Status != null) {
        const node = __XmlNode.of("ExistingObjectReplicationStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ExposeHeaders = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("ExposeHeader", entry);
        return node.withName("member");
    });
};
const se_FilterRule = (input, context) => {
    const bodyNode = new __XmlNode("FilterRule");
    if (input.Name != null) {
        const node = __XmlNode.of("FilterRuleName", input.Name).withName("Name");
        bodyNode.addChildNode(node);
    }
    if (input.Value != null) {
        const node = __XmlNode.of("FilterRuleValue", input.Value).withName("Value");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_FilterRuleList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_FilterRule(entry, context);
        return node.withName("member");
    });
};
const se_GlacierJobParameters = (input, context) => {
    const bodyNode = new __XmlNode("GlacierJobParameters");
    if (input.Tier != null) {
        const node = __XmlNode.of("Tier", input.Tier).withName("Tier");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Grant = (input, context) => {
    const bodyNode = new __XmlNode("Grant");
    if (input.Grantee != null) {
        const node = se_Grantee(input.Grantee, context).withName("Grantee");
        node.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        bodyNode.addChildNode(node);
    }
    if (input.Permission != null) {
        const node = __XmlNode.of("Permission", input.Permission).withName("Permission");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Grantee = (input, context) => {
    const bodyNode = new __XmlNode("Grantee");
    if (input.DisplayName != null) {
        const node = __XmlNode.of("DisplayName", input.DisplayName).withName("DisplayName");
        bodyNode.addChildNode(node);
    }
    if (input.EmailAddress != null) {
        const node = __XmlNode.of("EmailAddress", input.EmailAddress).withName("EmailAddress");
        bodyNode.addChildNode(node);
    }
    if (input.ID != null) {
        const node = __XmlNode.of("ID", input.ID).withName("ID");
        bodyNode.addChildNode(node);
    }
    if (input.URI != null) {
        const node = __XmlNode.of("URI", input.URI).withName("URI");
        bodyNode.addChildNode(node);
    }
    if (input.Type != null) {
        bodyNode.addAttribute("xsi:type", input.Type);
    }
    return bodyNode;
};
const se_Grants = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_Grant(entry, context);
        return node.withName("Grant");
    });
};
const se_IndexDocument = (input, context) => {
    const bodyNode = new __XmlNode("IndexDocument");
    if (input.Suffix != null) {
        const node = __XmlNode.of("Suffix", input.Suffix).withName("Suffix");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InputSerialization = (input, context) => {
    const bodyNode = new __XmlNode("InputSerialization");
    if (input.CSV != null) {
        const node = se_CSVInput(input.CSV, context).withName("CSV");
        bodyNode.addChildNode(node);
    }
    if (input.CompressionType != null) {
        const node = __XmlNode.of("CompressionType", input.CompressionType).withName("CompressionType");
        bodyNode.addChildNode(node);
    }
    if (input.JSON != null) {
        const node = se_JSONInput(input.JSON, context).withName("JSON");
        bodyNode.addChildNode(node);
    }
    if (input.Parquet != null) {
        const node = se_ParquetInput(input.Parquet, context).withName("Parquet");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_IntelligentTieringAndOperator = (input, context) => {
    const bodyNode = new __XmlNode("IntelligentTieringAndOperator");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tags != null) {
        const nodes = se_TagSet(input.Tags, context);
        nodes.map((node) => {
            node = node.withName("Tag");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_IntelligentTieringConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("IntelligentTieringConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("IntelligentTieringId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_IntelligentTieringFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    if (input.Status != null) {
        const node = __XmlNode.of("IntelligentTieringStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    if (input.Tierings != null) {
        const nodes = se_TieringList(input.Tierings, context);
        nodes.map((node) => {
            node = node.withName("Tiering");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_IntelligentTieringFilter = (input, context) => {
    const bodyNode = new __XmlNode("IntelligentTieringFilter");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tag != null) {
        const node = se_Tag(input.Tag, context).withName("Tag");
        bodyNode.addChildNode(node);
    }
    if (input.And != null) {
        const node = se_IntelligentTieringAndOperator(input.And, context).withName("And");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventoryConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("InventoryConfiguration");
    if (input.Destination != null) {
        const node = se_InventoryDestination(input.Destination, context).withName("Destination");
        bodyNode.addChildNode(node);
    }
    if (input.IsEnabled != null) {
        const node = __XmlNode.of("IsEnabled", String(input.IsEnabled)).withName("IsEnabled");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_InventoryFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    if (input.Id != null) {
        const node = __XmlNode.of("InventoryId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.IncludedObjectVersions != null) {
        const node = __XmlNode
            .of("InventoryIncludedObjectVersions", input.IncludedObjectVersions)
            .withName("IncludedObjectVersions");
        bodyNode.addChildNode(node);
    }
    if (input.OptionalFields != null) {
        const nodes = se_InventoryOptionalFields(input.OptionalFields, context);
        const containerNode = new __XmlNode("OptionalFields");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    if (input.Schedule != null) {
        const node = se_InventorySchedule(input.Schedule, context).withName("Schedule");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventoryDestination = (input, context) => {
    const bodyNode = new __XmlNode("InventoryDestination");
    if (input.S3BucketDestination != null) {
        const node = se_InventoryS3BucketDestination(input.S3BucketDestination, context).withName("S3BucketDestination");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventoryEncryption = (input, context) => {
    const bodyNode = new __XmlNode("InventoryEncryption");
    if (input.SSES3 != null) {
        const node = se_SSES3(input.SSES3, context).withName("SSE-S3");
        bodyNode.addChildNode(node);
    }
    if (input.SSEKMS != null) {
        const node = se_SSEKMS(input.SSEKMS, context).withName("SSE-KMS");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventoryFilter = (input, context) => {
    const bodyNode = new __XmlNode("InventoryFilter");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventoryOptionalFields = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = __XmlNode.of("InventoryOptionalField", entry);
        return node.withName("Field");
    });
};
const se_InventoryS3BucketDestination = (input, context) => {
    const bodyNode = new __XmlNode("InventoryS3BucketDestination");
    if (input.AccountId != null) {
        const node = __XmlNode.of("AccountId", input.AccountId).withName("AccountId");
        bodyNode.addChildNode(node);
    }
    if (input.Bucket != null) {
        const node = __XmlNode.of("BucketName", input.Bucket).withName("Bucket");
        bodyNode.addChildNode(node);
    }
    if (input.Format != null) {
        const node = __XmlNode.of("InventoryFormat", input.Format).withName("Format");
        bodyNode.addChildNode(node);
    }
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Encryption != null) {
        const node = se_InventoryEncryption(input.Encryption, context).withName("Encryption");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_InventorySchedule = (input, context) => {
    const bodyNode = new __XmlNode("InventorySchedule");
    if (input.Frequency != null) {
        const node = __XmlNode.of("InventoryFrequency", input.Frequency).withName("Frequency");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_JSONInput = (input, context) => {
    const bodyNode = new __XmlNode("JSONInput");
    if (input.Type != null) {
        const node = __XmlNode.of("JSONType", input.Type).withName("Type");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_JSONOutput = (input, context) => {
    const bodyNode = new __XmlNode("JSONOutput");
    if (input.RecordDelimiter != null) {
        const node = __XmlNode.of("RecordDelimiter", input.RecordDelimiter).withName("RecordDelimiter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_LambdaFunctionConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("LambdaFunctionConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("NotificationId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.LambdaFunctionArn != null) {
        const node = __XmlNode.of("LambdaFunctionArn", input.LambdaFunctionArn).withName("CloudFunction");
        bodyNode.addChildNode(node);
    }
    if (input.Events != null) {
        const nodes = se_EventList(input.Events, context);
        nodes.map((node) => {
            node = node.withName("Event");
            bodyNode.addChildNode(node);
        });
    }
    if (input.Filter != null) {
        const node = se_NotificationConfigurationFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_LambdaFunctionConfigurationList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_LambdaFunctionConfiguration(entry, context);
        return node.withName("member");
    });
};
const se_LifecycleExpiration = (input, context) => {
    const bodyNode = new __XmlNode("LifecycleExpiration");
    if (input.Date != null) {
        const node = __XmlNode.of("Date", (input.Date.toISOString().split(".")[0] + "Z").toString()).withName("Date");
        bodyNode.addChildNode(node);
    }
    if (input.Days != null) {
        const node = __XmlNode.of("Days", String(input.Days)).withName("Days");
        bodyNode.addChildNode(node);
    }
    if (input.ExpiredObjectDeleteMarker != null) {
        const node = __XmlNode
            .of("ExpiredObjectDeleteMarker", String(input.ExpiredObjectDeleteMarker))
            .withName("ExpiredObjectDeleteMarker");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_LifecycleRule = (input, context) => {
    const bodyNode = new __XmlNode("LifecycleRule");
    if (input.Expiration != null) {
        const node = se_LifecycleExpiration(input.Expiration, context).withName("Expiration");
        bodyNode.addChildNode(node);
    }
    if (input.ID != null) {
        const node = __XmlNode.of("ID", input.ID).withName("ID");
        bodyNode.addChildNode(node);
    }
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_LifecycleRuleFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    if (input.Status != null) {
        const node = __XmlNode.of("ExpirationStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    if (input.Transitions != null) {
        const nodes = se_TransitionList(input.Transitions, context);
        nodes.map((node) => {
            node = node.withName("Transition");
            bodyNode.addChildNode(node);
        });
    }
    if (input.NoncurrentVersionTransitions != null) {
        const nodes = se_NoncurrentVersionTransitionList(input.NoncurrentVersionTransitions, context);
        nodes.map((node) => {
            node = node.withName("NoncurrentVersionTransition");
            bodyNode.addChildNode(node);
        });
    }
    if (input.NoncurrentVersionExpiration != null) {
        const node = se_NoncurrentVersionExpiration(input.NoncurrentVersionExpiration, context).withName("NoncurrentVersionExpiration");
        bodyNode.addChildNode(node);
    }
    if (input.AbortIncompleteMultipartUpload != null) {
        const node = se_AbortIncompleteMultipartUpload(input.AbortIncompleteMultipartUpload, context).withName("AbortIncompleteMultipartUpload");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_LifecycleRuleAndOperator = (input, context) => {
    const bodyNode = new __XmlNode("LifecycleRuleAndOperator");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tags != null) {
        const nodes = se_TagSet(input.Tags, context);
        nodes.map((node) => {
            node = node.withName("Tag");
            bodyNode.addChildNode(node);
        });
    }
    if (input.ObjectSizeGreaterThan != null) {
        const node = __XmlNode
            .of("ObjectSizeGreaterThanBytes", String(input.ObjectSizeGreaterThan))
            .withName("ObjectSizeGreaterThan");
        bodyNode.addChildNode(node);
    }
    if (input.ObjectSizeLessThan != null) {
        const node = __XmlNode
            .of("ObjectSizeLessThanBytes", String(input.ObjectSizeLessThan))
            .withName("ObjectSizeLessThan");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_LifecycleRuleFilter = (input, context) => {
    const bodyNode = new __XmlNode("LifecycleRuleFilter");
    LifecycleRuleFilter.visit(input, {
        Prefix: (value) => {
            const node = __XmlNode.of("Prefix", value).withName("Prefix");
            bodyNode.addChildNode(node);
        },
        Tag: (value) => {
            const node = se_Tag(value, context).withName("Tag");
            bodyNode.addChildNode(node);
        },
        ObjectSizeGreaterThan: (value) => {
            const node = __XmlNode.of("ObjectSizeGreaterThanBytes", String(value)).withName("ObjectSizeGreaterThan");
            bodyNode.addChildNode(node);
        },
        ObjectSizeLessThan: (value) => {
            const node = __XmlNode.of("ObjectSizeLessThanBytes", String(value)).withName("ObjectSizeLessThan");
            bodyNode.addChildNode(node);
        },
        And: (value) => {
            const node = se_LifecycleRuleAndOperator(value, context).withName("And");
            bodyNode.addChildNode(node);
        },
        _: (name, value) => {
            if (!(value instanceof __XmlNode || value instanceof __XmlText)) {
                throw new Error("Unable to serialize unknown union members in XML.");
            }
            bodyNode.addChildNode(new __XmlNode(name).addChildNode(value));
        },
    });
    return bodyNode;
};
const se_LifecycleRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_LifecycleRule(entry, context);
        return node.withName("member");
    });
};
const se_LoggingEnabled = (input, context) => {
    const bodyNode = new __XmlNode("LoggingEnabled");
    if (input.TargetBucket != null) {
        const node = __XmlNode.of("TargetBucket", input.TargetBucket).withName("TargetBucket");
        bodyNode.addChildNode(node);
    }
    if (input.TargetGrants != null) {
        const nodes = se_TargetGrants(input.TargetGrants, context);
        const containerNode = new __XmlNode("TargetGrants");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    if (input.TargetPrefix != null) {
        const node = __XmlNode.of("TargetPrefix", input.TargetPrefix).withName("TargetPrefix");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_MetadataEntry = (input, context) => {
    const bodyNode = new __XmlNode("MetadataEntry");
    if (input.Name != null) {
        const node = __XmlNode.of("MetadataKey", input.Name).withName("Name");
        bodyNode.addChildNode(node);
    }
    if (input.Value != null) {
        const node = __XmlNode.of("MetadataValue", input.Value).withName("Value");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Metrics = (input, context) => {
    const bodyNode = new __XmlNode("Metrics");
    if (input.Status != null) {
        const node = __XmlNode.of("MetricsStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    if (input.EventThreshold != null) {
        const node = se_ReplicationTimeValue(input.EventThreshold, context).withName("EventThreshold");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_MetricsAndOperator = (input, context) => {
    const bodyNode = new __XmlNode("MetricsAndOperator");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tags != null) {
        const nodes = se_TagSet(input.Tags, context);
        nodes.map((node) => {
            node = node.withName("Tag");
            bodyNode.addChildNode(node);
        });
    }
    if (input.AccessPointArn != null) {
        const node = __XmlNode.of("AccessPointArn", input.AccessPointArn).withName("AccessPointArn");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_MetricsConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("MetricsConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("MetricsId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_MetricsFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_MetricsFilter = (input, context) => {
    const bodyNode = new __XmlNode("MetricsFilter");
    MetricsFilter.visit(input, {
        Prefix: (value) => {
            const node = __XmlNode.of("Prefix", value).withName("Prefix");
            bodyNode.addChildNode(node);
        },
        Tag: (value) => {
            const node = se_Tag(value, context).withName("Tag");
            bodyNode.addChildNode(node);
        },
        AccessPointArn: (value) => {
            const node = __XmlNode.of("AccessPointArn", value).withName("AccessPointArn");
            bodyNode.addChildNode(node);
        },
        And: (value) => {
            const node = se_MetricsAndOperator(value, context).withName("And");
            bodyNode.addChildNode(node);
        },
        _: (name, value) => {
            if (!(value instanceof __XmlNode || value instanceof __XmlText)) {
                throw new Error("Unable to serialize unknown union members in XML.");
            }
            bodyNode.addChildNode(new __XmlNode(name).addChildNode(value));
        },
    });
    return bodyNode;
};
const se_NoncurrentVersionExpiration = (input, context) => {
    const bodyNode = new __XmlNode("NoncurrentVersionExpiration");
    if (input.NoncurrentDays != null) {
        const node = __XmlNode.of("Days", String(input.NoncurrentDays)).withName("NoncurrentDays");
        bodyNode.addChildNode(node);
    }
    if (input.NewerNoncurrentVersions != null) {
        const node = __XmlNode
            .of("VersionCount", String(input.NewerNoncurrentVersions))
            .withName("NewerNoncurrentVersions");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_NoncurrentVersionTransition = (input, context) => {
    const bodyNode = new __XmlNode("NoncurrentVersionTransition");
    if (input.NoncurrentDays != null) {
        const node = __XmlNode.of("Days", String(input.NoncurrentDays)).withName("NoncurrentDays");
        bodyNode.addChildNode(node);
    }
    if (input.StorageClass != null) {
        const node = __XmlNode.of("TransitionStorageClass", input.StorageClass).withName("StorageClass");
        bodyNode.addChildNode(node);
    }
    if (input.NewerNoncurrentVersions != null) {
        const node = __XmlNode
            .of("VersionCount", String(input.NewerNoncurrentVersions))
            .withName("NewerNoncurrentVersions");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_NoncurrentVersionTransitionList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_NoncurrentVersionTransition(entry, context);
        return node.withName("member");
    });
};
const se_NotificationConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("NotificationConfiguration");
    if (input.TopicConfigurations != null) {
        const nodes = se_TopicConfigurationList(input.TopicConfigurations, context);
        nodes.map((node) => {
            node = node.withName("TopicConfiguration");
            bodyNode.addChildNode(node);
        });
    }
    if (input.QueueConfigurations != null) {
        const nodes = se_QueueConfigurationList(input.QueueConfigurations, context);
        nodes.map((node) => {
            node = node.withName("QueueConfiguration");
            bodyNode.addChildNode(node);
        });
    }
    if (input.LambdaFunctionConfigurations != null) {
        const nodes = se_LambdaFunctionConfigurationList(input.LambdaFunctionConfigurations, context);
        nodes.map((node) => {
            node = node.withName("CloudFunctionConfiguration");
            bodyNode.addChildNode(node);
        });
    }
    if (input.EventBridgeConfiguration != null) {
        const node = se_EventBridgeConfiguration(input.EventBridgeConfiguration, context).withName("EventBridgeConfiguration");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_NotificationConfigurationFilter = (input, context) => {
    const bodyNode = new __XmlNode("NotificationConfigurationFilter");
    if (input.Key != null) {
        const node = se_S3KeyFilter(input.Key, context).withName("S3Key");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ObjectIdentifier = (input, context) => {
    const bodyNode = new __XmlNode("ObjectIdentifier");
    if (input.Key != null) {
        const node = __XmlNode.of("ObjectKey", input.Key).withName("Key");
        bodyNode.addChildNode(node);
    }
    if (input.VersionId != null) {
        const node = __XmlNode.of("ObjectVersionId", input.VersionId).withName("VersionId");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ObjectIdentifierList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_ObjectIdentifier(entry, context);
        return node.withName("member");
    });
};
const se_ObjectLockConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("ObjectLockConfiguration");
    if (input.ObjectLockEnabled != null) {
        const node = __XmlNode.of("ObjectLockEnabled", input.ObjectLockEnabled).withName("ObjectLockEnabled");
        bodyNode.addChildNode(node);
    }
    if (input.Rule != null) {
        const node = se_ObjectLockRule(input.Rule, context).withName("Rule");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ObjectLockLegalHold = (input, context) => {
    const bodyNode = new __XmlNode("ObjectLockLegalHold");
    if (input.Status != null) {
        const node = __XmlNode.of("ObjectLockLegalHoldStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ObjectLockRetention = (input, context) => {
    const bodyNode = new __XmlNode("ObjectLockRetention");
    if (input.Mode != null) {
        const node = __XmlNode.of("ObjectLockRetentionMode", input.Mode).withName("Mode");
        bodyNode.addChildNode(node);
    }
    if (input.RetainUntilDate != null) {
        const node = __XmlNode
            .of("Date", (input.RetainUntilDate.toISOString().split(".")[0] + "Z").toString())
            .withName("RetainUntilDate");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ObjectLockRule = (input, context) => {
    const bodyNode = new __XmlNode("ObjectLockRule");
    if (input.DefaultRetention != null) {
        const node = se_DefaultRetention(input.DefaultRetention, context).withName("DefaultRetention");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_OutputLocation = (input, context) => {
    const bodyNode = new __XmlNode("OutputLocation");
    if (input.S3 != null) {
        const node = se_S3Location(input.S3, context).withName("S3");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_OutputSerialization = (input, context) => {
    const bodyNode = new __XmlNode("OutputSerialization");
    if (input.CSV != null) {
        const node = se_CSVOutput(input.CSV, context).withName("CSV");
        bodyNode.addChildNode(node);
    }
    if (input.JSON != null) {
        const node = se_JSONOutput(input.JSON, context).withName("JSON");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Owner = (input, context) => {
    const bodyNode = new __XmlNode("Owner");
    if (input.DisplayName != null) {
        const node = __XmlNode.of("DisplayName", input.DisplayName).withName("DisplayName");
        bodyNode.addChildNode(node);
    }
    if (input.ID != null) {
        const node = __XmlNode.of("ID", input.ID).withName("ID");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_OwnershipControls = (input, context) => {
    const bodyNode = new __XmlNode("OwnershipControls");
    if (input.Rules != null) {
        const nodes = se_OwnershipControlsRules(input.Rules, context);
        nodes.map((node) => {
            node = node.withName("Rule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_OwnershipControlsRule = (input, context) => {
    const bodyNode = new __XmlNode("OwnershipControlsRule");
    if (input.ObjectOwnership != null) {
        const node = __XmlNode.of("ObjectOwnership", input.ObjectOwnership).withName("ObjectOwnership");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_OwnershipControlsRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_OwnershipControlsRule(entry, context);
        return node.withName("member");
    });
};
const se_ParquetInput = (input, context) => {
    const bodyNode = new __XmlNode("ParquetInput");
    return bodyNode;
};
const se_PublicAccessBlockConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("PublicAccessBlockConfiguration");
    if (input.BlockPublicAcls != null) {
        const node = __XmlNode.of("Setting", String(input.BlockPublicAcls)).withName("BlockPublicAcls");
        bodyNode.addChildNode(node);
    }
    if (input.IgnorePublicAcls != null) {
        const node = __XmlNode.of("Setting", String(input.IgnorePublicAcls)).withName("IgnorePublicAcls");
        bodyNode.addChildNode(node);
    }
    if (input.BlockPublicPolicy != null) {
        const node = __XmlNode.of("Setting", String(input.BlockPublicPolicy)).withName("BlockPublicPolicy");
        bodyNode.addChildNode(node);
    }
    if (input.RestrictPublicBuckets != null) {
        const node = __XmlNode.of("Setting", String(input.RestrictPublicBuckets)).withName("RestrictPublicBuckets");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_QueueConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("QueueConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("NotificationId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.QueueArn != null) {
        const node = __XmlNode.of("QueueArn", input.QueueArn).withName("Queue");
        bodyNode.addChildNode(node);
    }
    if (input.Events != null) {
        const nodes = se_EventList(input.Events, context);
        nodes.map((node) => {
            node = node.withName("Event");
            bodyNode.addChildNode(node);
        });
    }
    if (input.Filter != null) {
        const node = se_NotificationConfigurationFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_QueueConfigurationList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_QueueConfiguration(entry, context);
        return node.withName("member");
    });
};
const se_Redirect = (input, context) => {
    const bodyNode = new __XmlNode("Redirect");
    if (input.HostName != null) {
        const node = __XmlNode.of("HostName", input.HostName).withName("HostName");
        bodyNode.addChildNode(node);
    }
    if (input.HttpRedirectCode != null) {
        const node = __XmlNode.of("HttpRedirectCode", input.HttpRedirectCode).withName("HttpRedirectCode");
        bodyNode.addChildNode(node);
    }
    if (input.Protocol != null) {
        const node = __XmlNode.of("Protocol", input.Protocol).withName("Protocol");
        bodyNode.addChildNode(node);
    }
    if (input.ReplaceKeyPrefixWith != null) {
        const node = __XmlNode.of("ReplaceKeyPrefixWith", input.ReplaceKeyPrefixWith).withName("ReplaceKeyPrefixWith");
        bodyNode.addChildNode(node);
    }
    if (input.ReplaceKeyWith != null) {
        const node = __XmlNode.of("ReplaceKeyWith", input.ReplaceKeyWith).withName("ReplaceKeyWith");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RedirectAllRequestsTo = (input, context) => {
    const bodyNode = new __XmlNode("RedirectAllRequestsTo");
    if (input.HostName != null) {
        const node = __XmlNode.of("HostName", input.HostName).withName("HostName");
        bodyNode.addChildNode(node);
    }
    if (input.Protocol != null) {
        const node = __XmlNode.of("Protocol", input.Protocol).withName("Protocol");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ReplicaModifications = (input, context) => {
    const bodyNode = new __XmlNode("ReplicaModifications");
    if (input.Status != null) {
        const node = __XmlNode.of("ReplicaModificationsStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ReplicationConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationConfiguration");
    if (input.Role != null) {
        const node = __XmlNode.of("Role", input.Role).withName("Role");
        bodyNode.addChildNode(node);
    }
    if (input.Rules != null) {
        const nodes = se_ReplicationRules(input.Rules, context);
        nodes.map((node) => {
            node = node.withName("Rule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_ReplicationRule = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationRule");
    if (input.ID != null) {
        const node = __XmlNode.of("ID", input.ID).withName("ID");
        bodyNode.addChildNode(node);
    }
    if (input.Priority != null) {
        const node = __XmlNode.of("Priority", String(input.Priority)).withName("Priority");
        bodyNode.addChildNode(node);
    }
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Filter != null) {
        const node = se_ReplicationRuleFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    if (input.Status != null) {
        const node = __XmlNode.of("ReplicationRuleStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    if (input.SourceSelectionCriteria != null) {
        const node = se_SourceSelectionCriteria(input.SourceSelectionCriteria, context).withName("SourceSelectionCriteria");
        bodyNode.addChildNode(node);
    }
    if (input.ExistingObjectReplication != null) {
        const node = se_ExistingObjectReplication(input.ExistingObjectReplication, context).withName("ExistingObjectReplication");
        bodyNode.addChildNode(node);
    }
    if (input.Destination != null) {
        const node = se_Destination(input.Destination, context).withName("Destination");
        bodyNode.addChildNode(node);
    }
    if (input.DeleteMarkerReplication != null) {
        const node = se_DeleteMarkerReplication(input.DeleteMarkerReplication, context).withName("DeleteMarkerReplication");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ReplicationRuleAndOperator = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationRuleAndOperator");
    if (input.Prefix != null) {
        const node = __XmlNode.of("Prefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Tags != null) {
        const nodes = se_TagSet(input.Tags, context);
        nodes.map((node) => {
            node = node.withName("Tag");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_ReplicationRuleFilter = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationRuleFilter");
    ReplicationRuleFilter.visit(input, {
        Prefix: (value) => {
            const node = __XmlNode.of("Prefix", value).withName("Prefix");
            bodyNode.addChildNode(node);
        },
        Tag: (value) => {
            const node = se_Tag(value, context).withName("Tag");
            bodyNode.addChildNode(node);
        },
        And: (value) => {
            const node = se_ReplicationRuleAndOperator(value, context).withName("And");
            bodyNode.addChildNode(node);
        },
        _: (name, value) => {
            if (!(value instanceof __XmlNode || value instanceof __XmlText)) {
                throw new Error("Unable to serialize unknown union members in XML.");
            }
            bodyNode.addChildNode(new __XmlNode(name).addChildNode(value));
        },
    });
    return bodyNode;
};
const se_ReplicationRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_ReplicationRule(entry, context);
        return node.withName("member");
    });
};
const se_ReplicationTime = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationTime");
    if (input.Status != null) {
        const node = __XmlNode.of("ReplicationTimeStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    if (input.Time != null) {
        const node = se_ReplicationTimeValue(input.Time, context).withName("Time");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ReplicationTimeValue = (input, context) => {
    const bodyNode = new __XmlNode("ReplicationTimeValue");
    if (input.Minutes != null) {
        const node = __XmlNode.of("Minutes", String(input.Minutes)).withName("Minutes");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RequestPaymentConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("RequestPaymentConfiguration");
    if (input.Payer != null) {
        const node = __XmlNode.of("Payer", input.Payer).withName("Payer");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RequestProgress = (input, context) => {
    const bodyNode = new __XmlNode("RequestProgress");
    if (input.Enabled != null) {
        const node = __XmlNode.of("EnableRequestProgress", String(input.Enabled)).withName("Enabled");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RestoreRequest = (input, context) => {
    const bodyNode = new __XmlNode("RestoreRequest");
    if (input.Days != null) {
        const node = __XmlNode.of("Days", String(input.Days)).withName("Days");
        bodyNode.addChildNode(node);
    }
    if (input.GlacierJobParameters != null) {
        const node = se_GlacierJobParameters(input.GlacierJobParameters, context).withName("GlacierJobParameters");
        bodyNode.addChildNode(node);
    }
    if (input.Type != null) {
        const node = __XmlNode.of("RestoreRequestType", input.Type).withName("Type");
        bodyNode.addChildNode(node);
    }
    if (input.Tier != null) {
        const node = __XmlNode.of("Tier", input.Tier).withName("Tier");
        bodyNode.addChildNode(node);
    }
    if (input.Description != null) {
        const node = __XmlNode.of("Description", input.Description).withName("Description");
        bodyNode.addChildNode(node);
    }
    if (input.SelectParameters != null) {
        const node = se_SelectParameters(input.SelectParameters, context).withName("SelectParameters");
        bodyNode.addChildNode(node);
    }
    if (input.OutputLocation != null) {
        const node = se_OutputLocation(input.OutputLocation, context).withName("OutputLocation");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RoutingRule = (input, context) => {
    const bodyNode = new __XmlNode("RoutingRule");
    if (input.Condition != null) {
        const node = se_Condition(input.Condition, context).withName("Condition");
        bodyNode.addChildNode(node);
    }
    if (input.Redirect != null) {
        const node = se_Redirect(input.Redirect, context).withName("Redirect");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_RoutingRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_RoutingRule(entry, context);
        return node.withName("RoutingRule");
    });
};
const se_S3KeyFilter = (input, context) => {
    const bodyNode = new __XmlNode("S3KeyFilter");
    if (input.FilterRules != null) {
        const nodes = se_FilterRuleList(input.FilterRules, context);
        nodes.map((node) => {
            node = node.withName("FilterRule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_S3Location = (input, context) => {
    const bodyNode = new __XmlNode("S3Location");
    if (input.BucketName != null) {
        const node = __XmlNode.of("BucketName", input.BucketName).withName("BucketName");
        bodyNode.addChildNode(node);
    }
    if (input.Prefix != null) {
        const node = __XmlNode.of("LocationPrefix", input.Prefix).withName("Prefix");
        bodyNode.addChildNode(node);
    }
    if (input.Encryption != null) {
        const node = se_Encryption(input.Encryption, context).withName("Encryption");
        bodyNode.addChildNode(node);
    }
    if (input.CannedACL != null) {
        const node = __XmlNode.of("ObjectCannedACL", input.CannedACL).withName("CannedACL");
        bodyNode.addChildNode(node);
    }
    if (input.AccessControlList != null) {
        const nodes = se_Grants(input.AccessControlList, context);
        const containerNode = new __XmlNode("AccessControlList");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    if (input.Tagging != null) {
        const node = se_Tagging(input.Tagging, context).withName("Tagging");
        bodyNode.addChildNode(node);
    }
    if (input.UserMetadata != null) {
        const nodes = se_UserMetadata(input.UserMetadata, context);
        const containerNode = new __XmlNode("UserMetadata");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    if (input.StorageClass != null) {
        const node = __XmlNode.of("StorageClass", input.StorageClass).withName("StorageClass");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ScanRange = (input, context) => {
    const bodyNode = new __XmlNode("ScanRange");
    if (input.Start != null) {
        const node = __XmlNode.of("Start", String(input.Start)).withName("Start");
        bodyNode.addChildNode(node);
    }
    if (input.End != null) {
        const node = __XmlNode.of("End", String(input.End)).withName("End");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_SelectParameters = (input, context) => {
    const bodyNode = new __XmlNode("SelectParameters");
    if (input.InputSerialization != null) {
        const node = se_InputSerialization(input.InputSerialization, context).withName("InputSerialization");
        bodyNode.addChildNode(node);
    }
    if (input.ExpressionType != null) {
        const node = __XmlNode.of("ExpressionType", input.ExpressionType).withName("ExpressionType");
        bodyNode.addChildNode(node);
    }
    if (input.Expression != null) {
        const node = __XmlNode.of("Expression", input.Expression).withName("Expression");
        bodyNode.addChildNode(node);
    }
    if (input.OutputSerialization != null) {
        const node = se_OutputSerialization(input.OutputSerialization, context).withName("OutputSerialization");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ServerSideEncryptionByDefault = (input, context) => {
    const bodyNode = new __XmlNode("ServerSideEncryptionByDefault");
    if (input.SSEAlgorithm != null) {
        const node = __XmlNode.of("ServerSideEncryption", input.SSEAlgorithm).withName("SSEAlgorithm");
        bodyNode.addChildNode(node);
    }
    if (input.KMSMasterKeyID != null) {
        const node = __XmlNode.of("SSEKMSKeyId", input.KMSMasterKeyID).withName("KMSMasterKeyID");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ServerSideEncryptionConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("ServerSideEncryptionConfiguration");
    if (input.Rules != null) {
        const nodes = se_ServerSideEncryptionRules(input.Rules, context);
        nodes.map((node) => {
            node = node.withName("Rule");
            bodyNode.addChildNode(node);
        });
    }
    return bodyNode;
};
const se_ServerSideEncryptionRule = (input, context) => {
    const bodyNode = new __XmlNode("ServerSideEncryptionRule");
    if (input.ApplyServerSideEncryptionByDefault != null) {
        const node = se_ServerSideEncryptionByDefault(input.ApplyServerSideEncryptionByDefault, context).withName("ApplyServerSideEncryptionByDefault");
        bodyNode.addChildNode(node);
    }
    if (input.BucketKeyEnabled != null) {
        const node = __XmlNode.of("BucketKeyEnabled", String(input.BucketKeyEnabled)).withName("BucketKeyEnabled");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_ServerSideEncryptionRules = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_ServerSideEncryptionRule(entry, context);
        return node.withName("member");
    });
};
const se_SourceSelectionCriteria = (input, context) => {
    const bodyNode = new __XmlNode("SourceSelectionCriteria");
    if (input.SseKmsEncryptedObjects != null) {
        const node = se_SseKmsEncryptedObjects(input.SseKmsEncryptedObjects, context).withName("SseKmsEncryptedObjects");
        bodyNode.addChildNode(node);
    }
    if (input.ReplicaModifications != null) {
        const node = se_ReplicaModifications(input.ReplicaModifications, context).withName("ReplicaModifications");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_SSEKMS = (input, context) => {
    const bodyNode = new __XmlNode("SSE-KMS");
    if (input.KeyId != null) {
        const node = __XmlNode.of("SSEKMSKeyId", input.KeyId).withName("KeyId");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_SseKmsEncryptedObjects = (input, context) => {
    const bodyNode = new __XmlNode("SseKmsEncryptedObjects");
    if (input.Status != null) {
        const node = __XmlNode.of("SseKmsEncryptedObjectsStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_SSES3 = (input, context) => {
    const bodyNode = new __XmlNode("SSE-S3");
    return bodyNode;
};
const se_StorageClassAnalysis = (input, context) => {
    const bodyNode = new __XmlNode("StorageClassAnalysis");
    if (input.DataExport != null) {
        const node = se_StorageClassAnalysisDataExport(input.DataExport, context).withName("DataExport");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_StorageClassAnalysisDataExport = (input, context) => {
    const bodyNode = new __XmlNode("StorageClassAnalysisDataExport");
    if (input.OutputSchemaVersion != null) {
        const node = __XmlNode
            .of("StorageClassAnalysisSchemaVersion", input.OutputSchemaVersion)
            .withName("OutputSchemaVersion");
        bodyNode.addChildNode(node);
    }
    if (input.Destination != null) {
        const node = se_AnalyticsExportDestination(input.Destination, context).withName("Destination");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Tag = (input, context) => {
    const bodyNode = new __XmlNode("Tag");
    if (input.Key != null) {
        const node = __XmlNode.of("ObjectKey", input.Key).withName("Key");
        bodyNode.addChildNode(node);
    }
    if (input.Value != null) {
        const node = __XmlNode.of("Value", input.Value).withName("Value");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_Tagging = (input, context) => {
    const bodyNode = new __XmlNode("Tagging");
    if (input.TagSet != null) {
        const nodes = se_TagSet(input.TagSet, context);
        const containerNode = new __XmlNode("TagSet");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    return bodyNode;
};
const se_TagSet = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_Tag(entry, context);
        return node.withName("Tag");
    });
};
const se_TargetGrant = (input, context) => {
    const bodyNode = new __XmlNode("TargetGrant");
    if (input.Grantee != null) {
        const node = se_Grantee(input.Grantee, context).withName("Grantee");
        node.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        bodyNode.addChildNode(node);
    }
    if (input.Permission != null) {
        const node = __XmlNode.of("BucketLogsPermission", input.Permission).withName("Permission");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_TargetGrants = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_TargetGrant(entry, context);
        return node.withName("Grant");
    });
};
const se_Tiering = (input, context) => {
    const bodyNode = new __XmlNode("Tiering");
    if (input.Days != null) {
        const node = __XmlNode.of("IntelligentTieringDays", String(input.Days)).withName("Days");
        bodyNode.addChildNode(node);
    }
    if (input.AccessTier != null) {
        const node = __XmlNode.of("IntelligentTieringAccessTier", input.AccessTier).withName("AccessTier");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_TieringList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_Tiering(entry, context);
        return node.withName("member");
    });
};
const se_TopicConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("TopicConfiguration");
    if (input.Id != null) {
        const node = __XmlNode.of("NotificationId", input.Id).withName("Id");
        bodyNode.addChildNode(node);
    }
    if (input.TopicArn != null) {
        const node = __XmlNode.of("TopicArn", input.TopicArn).withName("Topic");
        bodyNode.addChildNode(node);
    }
    if (input.Events != null) {
        const nodes = se_EventList(input.Events, context);
        nodes.map((node) => {
            node = node.withName("Event");
            bodyNode.addChildNode(node);
        });
    }
    if (input.Filter != null) {
        const node = se_NotificationConfigurationFilter(input.Filter, context).withName("Filter");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_TopicConfigurationList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_TopicConfiguration(entry, context);
        return node.withName("member");
    });
};
const se_Transition = (input, context) => {
    const bodyNode = new __XmlNode("Transition");
    if (input.Date != null) {
        const node = __XmlNode.of("Date", (input.Date.toISOString().split(".")[0] + "Z").toString()).withName("Date");
        bodyNode.addChildNode(node);
    }
    if (input.Days != null) {
        const node = __XmlNode.of("Days", String(input.Days)).withName("Days");
        bodyNode.addChildNode(node);
    }
    if (input.StorageClass != null) {
        const node = __XmlNode.of("TransitionStorageClass", input.StorageClass).withName("StorageClass");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_TransitionList = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_Transition(entry, context);
        return node.withName("member");
    });
};
const se_UserMetadata = (input, context) => {
    return input
        .filter((e) => e != null)
        .map((entry) => {
        const node = se_MetadataEntry(entry, context);
        return node.withName("MetadataEntry");
    });
};
const se_VersioningConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("VersioningConfiguration");
    if (input.MFADelete != null) {
        const node = __XmlNode.of("MFADelete", input.MFADelete).withName("MfaDelete");
        bodyNode.addChildNode(node);
    }
    if (input.Status != null) {
        const node = __XmlNode.of("BucketVersioningStatus", input.Status).withName("Status");
        bodyNode.addChildNode(node);
    }
    return bodyNode;
};
const se_WebsiteConfiguration = (input, context) => {
    const bodyNode = new __XmlNode("WebsiteConfiguration");
    if (input.ErrorDocument != null) {
        const node = se_ErrorDocument(input.ErrorDocument, context).withName("ErrorDocument");
        bodyNode.addChildNode(node);
    }
    if (input.IndexDocument != null) {
        const node = se_IndexDocument(input.IndexDocument, context).withName("IndexDocument");
        bodyNode.addChildNode(node);
    }
    if (input.RedirectAllRequestsTo != null) {
        const node = se_RedirectAllRequestsTo(input.RedirectAllRequestsTo, context).withName("RedirectAllRequestsTo");
        bodyNode.addChildNode(node);
    }
    if (input.RoutingRules != null) {
        const nodes = se_RoutingRules(input.RoutingRules, context);
        const containerNode = new __XmlNode("RoutingRules");
        nodes.map((node) => {
            containerNode.addChildNode(node);
        });
        bodyNode.addChildNode(containerNode);
    }
    return bodyNode;
};
const de_AbortIncompleteMultipartUpload = (output, context) => {
    const contents = {};
    if (output["DaysAfterInitiation"] !== undefined) {
        contents.DaysAfterInitiation = __strictParseInt32(output["DaysAfterInitiation"]);
    }
    return contents;
};
const de_AccessControlTranslation = (output, context) => {
    const contents = {};
    if (output["Owner"] !== undefined) {
        contents.Owner = __expectString(output["Owner"]);
    }
    return contents;
};
const de_AllowedHeaders = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_AllowedMethods = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_AllowedOrigins = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_AnalyticsAndOperator = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Tag === "") {
        contents.Tags = [];
    }
    else if (output["Tag"] !== undefined) {
        contents.Tags = de_TagSet(__getArrayIfSingleItem(output["Tag"]), context);
    }
    return contents;
};
const de_AnalyticsConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output.Filter === "") {
    }
    else if (output["Filter"] !== undefined) {
        contents.Filter = de_AnalyticsFilter(__expectUnion(output["Filter"]), context);
    }
    if (output["StorageClassAnalysis"] !== undefined) {
        contents.StorageClassAnalysis = de_StorageClassAnalysis(output["StorageClassAnalysis"], context);
    }
    return contents;
};
const de_AnalyticsConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_AnalyticsConfiguration(entry, context);
    });
};
const de_AnalyticsExportDestination = (output, context) => {
    const contents = {};
    if (output["S3BucketDestination"] !== undefined) {
        contents.S3BucketDestination = de_AnalyticsS3BucketDestination(output["S3BucketDestination"], context);
    }
    return contents;
};
const de_AnalyticsFilter = (output, context) => {
    if (output["Prefix"] !== undefined) {
        return {
            Prefix: __expectString(output["Prefix"]),
        };
    }
    if (output["Tag"] !== undefined) {
        return {
            Tag: de_Tag(output["Tag"], context),
        };
    }
    if (output["And"] !== undefined) {
        return {
            And: de_AnalyticsAndOperator(output["And"], context),
        };
    }
    return { $unknown: Object.entries(output)[0] };
};
const de_AnalyticsS3BucketDestination = (output, context) => {
    const contents = {};
    if (output["Format"] !== undefined) {
        contents.Format = __expectString(output["Format"]);
    }
    if (output["BucketAccountId"] !== undefined) {
        contents.BucketAccountId = __expectString(output["BucketAccountId"]);
    }
    if (output["Bucket"] !== undefined) {
        contents.Bucket = __expectString(output["Bucket"]);
    }
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    return contents;
};
const de_Bucket = (output, context) => {
    const contents = {};
    if (output["Name"] !== undefined) {
        contents.Name = __expectString(output["Name"]);
    }
    if (output["CreationDate"] !== undefined) {
        contents.CreationDate = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["CreationDate"]));
    }
    return contents;
};
const de_Buckets = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Bucket(entry, context);
    });
};
const de_Checksum = (output, context) => {
    const contents = {};
    if (output["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(output["ChecksumCRC32"]);
    }
    if (output["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(output["ChecksumCRC32C"]);
    }
    if (output["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(output["ChecksumSHA1"]);
    }
    if (output["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(output["ChecksumSHA256"]);
    }
    return contents;
};
const de_ChecksumAlgorithmList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_CommonPrefix = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    return contents;
};
const de_CommonPrefixList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_CommonPrefix(entry, context);
    });
};
const de_Condition = (output, context) => {
    const contents = {};
    if (output["HttpErrorCodeReturnedEquals"] !== undefined) {
        contents.HttpErrorCodeReturnedEquals = __expectString(output["HttpErrorCodeReturnedEquals"]);
    }
    if (output["KeyPrefixEquals"] !== undefined) {
        contents.KeyPrefixEquals = __expectString(output["KeyPrefixEquals"]);
    }
    return contents;
};
const de_ContinuationEvent = (output, context) => {
    const contents = {};
    return contents;
};
const de_CopyObjectResult = (output, context) => {
    const contents = {};
    if (output["ETag"] !== undefined) {
        contents.ETag = __expectString(output["ETag"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    if (output["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(output["ChecksumCRC32"]);
    }
    if (output["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(output["ChecksumCRC32C"]);
    }
    if (output["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(output["ChecksumSHA1"]);
    }
    if (output["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(output["ChecksumSHA256"]);
    }
    return contents;
};
const de_CopyPartResult = (output, context) => {
    const contents = {};
    if (output["ETag"] !== undefined) {
        contents.ETag = __expectString(output["ETag"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    if (output["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(output["ChecksumCRC32"]);
    }
    if (output["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(output["ChecksumCRC32C"]);
    }
    if (output["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(output["ChecksumSHA1"]);
    }
    if (output["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(output["ChecksumSHA256"]);
    }
    return contents;
};
const de_CORSRule = (output, context) => {
    const contents = {};
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    if (output.AllowedHeader === "") {
        contents.AllowedHeaders = [];
    }
    else if (output["AllowedHeader"] !== undefined) {
        contents.AllowedHeaders = de_AllowedHeaders(__getArrayIfSingleItem(output["AllowedHeader"]), context);
    }
    if (output.AllowedMethod === "") {
        contents.AllowedMethods = [];
    }
    else if (output["AllowedMethod"] !== undefined) {
        contents.AllowedMethods = de_AllowedMethods(__getArrayIfSingleItem(output["AllowedMethod"]), context);
    }
    if (output.AllowedOrigin === "") {
        contents.AllowedOrigins = [];
    }
    else if (output["AllowedOrigin"] !== undefined) {
        contents.AllowedOrigins = de_AllowedOrigins(__getArrayIfSingleItem(output["AllowedOrigin"]), context);
    }
    if (output.ExposeHeader === "") {
        contents.ExposeHeaders = [];
    }
    else if (output["ExposeHeader"] !== undefined) {
        contents.ExposeHeaders = de_ExposeHeaders(__getArrayIfSingleItem(output["ExposeHeader"]), context);
    }
    if (output["MaxAgeSeconds"] !== undefined) {
        contents.MaxAgeSeconds = __strictParseInt32(output["MaxAgeSeconds"]);
    }
    return contents;
};
const de_CORSRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_CORSRule(entry, context);
    });
};
const de_DefaultRetention = (output, context) => {
    const contents = {};
    if (output["Mode"] !== undefined) {
        contents.Mode = __expectString(output["Mode"]);
    }
    if (output["Days"] !== undefined) {
        contents.Days = __strictParseInt32(output["Days"]);
    }
    if (output["Years"] !== undefined) {
        contents.Years = __strictParseInt32(output["Years"]);
    }
    return contents;
};
const de_DeletedObject = (output, context) => {
    const contents = {};
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["VersionId"] !== undefined) {
        contents.VersionId = __expectString(output["VersionId"]);
    }
    if (output["DeleteMarker"] !== undefined) {
        contents.DeleteMarker = __parseBoolean(output["DeleteMarker"]);
    }
    if (output["DeleteMarkerVersionId"] !== undefined) {
        contents.DeleteMarkerVersionId = __expectString(output["DeleteMarkerVersionId"]);
    }
    return contents;
};
const de_DeletedObjects = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_DeletedObject(entry, context);
    });
};
const de_DeleteMarkerEntry = (output, context) => {
    const contents = {};
    if (output["Owner"] !== undefined) {
        contents.Owner = de_Owner(output["Owner"], context);
    }
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["VersionId"] !== undefined) {
        contents.VersionId = __expectString(output["VersionId"]);
    }
    if (output["IsLatest"] !== undefined) {
        contents.IsLatest = __parseBoolean(output["IsLatest"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    return contents;
};
const de_DeleteMarkerReplication = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    return contents;
};
const de_DeleteMarkers = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_DeleteMarkerEntry(entry, context);
    });
};
const de_Destination = (output, context) => {
    const contents = {};
    if (output["Bucket"] !== undefined) {
        contents.Bucket = __expectString(output["Bucket"]);
    }
    if (output["Account"] !== undefined) {
        contents.Account = __expectString(output["Account"]);
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    if (output["AccessControlTranslation"] !== undefined) {
        contents.AccessControlTranslation = de_AccessControlTranslation(output["AccessControlTranslation"], context);
    }
    if (output["EncryptionConfiguration"] !== undefined) {
        contents.EncryptionConfiguration = de_EncryptionConfiguration(output["EncryptionConfiguration"], context);
    }
    if (output["ReplicationTime"] !== undefined) {
        contents.ReplicationTime = de_ReplicationTime(output["ReplicationTime"], context);
    }
    if (output["Metrics"] !== undefined) {
        contents.Metrics = de_Metrics(output["Metrics"], context);
    }
    return contents;
};
const de_EncryptionConfiguration = (output, context) => {
    const contents = {};
    if (output["ReplicaKmsKeyID"] !== undefined) {
        contents.ReplicaKmsKeyID = __expectString(output["ReplicaKmsKeyID"]);
    }
    return contents;
};
const de_EndEvent = (output, context) => {
    const contents = {};
    return contents;
};
const de__Error = (output, context) => {
    const contents = {};
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["VersionId"] !== undefined) {
        contents.VersionId = __expectString(output["VersionId"]);
    }
    if (output["Code"] !== undefined) {
        contents.Code = __expectString(output["Code"]);
    }
    if (output["Message"] !== undefined) {
        contents.Message = __expectString(output["Message"]);
    }
    return contents;
};
const de_ErrorDocument = (output, context) => {
    const contents = {};
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    return contents;
};
const de_Errors = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de__Error(entry, context);
    });
};
const de_EventBridgeConfiguration = (output, context) => {
    const contents = {};
    return contents;
};
const de_EventList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_ExistingObjectReplication = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    return contents;
};
const de_ExposeHeaders = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_FilterRule = (output, context) => {
    const contents = {};
    if (output["Name"] !== undefined) {
        contents.Name = __expectString(output["Name"]);
    }
    if (output["Value"] !== undefined) {
        contents.Value = __expectString(output["Value"]);
    }
    return contents;
};
const de_FilterRuleList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_FilterRule(entry, context);
    });
};
const de_GetObjectAttributesParts = (output, context) => {
    const contents = {};
    if (output["PartsCount"] !== undefined) {
        contents.TotalPartsCount = __strictParseInt32(output["PartsCount"]);
    }
    if (output["PartNumberMarker"] !== undefined) {
        contents.PartNumberMarker = __expectString(output["PartNumberMarker"]);
    }
    if (output["NextPartNumberMarker"] !== undefined) {
        contents.NextPartNumberMarker = __expectString(output["NextPartNumberMarker"]);
    }
    if (output["MaxParts"] !== undefined) {
        contents.MaxParts = __strictParseInt32(output["MaxParts"]);
    }
    if (output["IsTruncated"] !== undefined) {
        contents.IsTruncated = __parseBoolean(output["IsTruncated"]);
    }
    if (output.Part === "") {
        contents.Parts = [];
    }
    else if (output["Part"] !== undefined) {
        contents.Parts = de_PartsList(__getArrayIfSingleItem(output["Part"]), context);
    }
    return contents;
};
const de_Grant = (output, context) => {
    const contents = {};
    if (output["Grantee"] !== undefined) {
        contents.Grantee = de_Grantee(output["Grantee"], context);
    }
    if (output["Permission"] !== undefined) {
        contents.Permission = __expectString(output["Permission"]);
    }
    return contents;
};
const de_Grantee = (output, context) => {
    const contents = {};
    if (output["DisplayName"] !== undefined) {
        contents.DisplayName = __expectString(output["DisplayName"]);
    }
    if (output["EmailAddress"] !== undefined) {
        contents.EmailAddress = __expectString(output["EmailAddress"]);
    }
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    if (output["URI"] !== undefined) {
        contents.URI = __expectString(output["URI"]);
    }
    if (output["xsi:type"] !== undefined) {
        contents.Type = __expectString(output["xsi:type"]);
    }
    return contents;
};
const de_Grants = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Grant(entry, context);
    });
};
const de_IndexDocument = (output, context) => {
    const contents = {};
    if (output["Suffix"] !== undefined) {
        contents.Suffix = __expectString(output["Suffix"]);
    }
    return contents;
};
const de_Initiator = (output, context) => {
    const contents = {};
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    if (output["DisplayName"] !== undefined) {
        contents.DisplayName = __expectString(output["DisplayName"]);
    }
    return contents;
};
const de_IntelligentTieringAndOperator = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Tag === "") {
        contents.Tags = [];
    }
    else if (output["Tag"] !== undefined) {
        contents.Tags = de_TagSet(__getArrayIfSingleItem(output["Tag"]), context);
    }
    return contents;
};
const de_IntelligentTieringConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output["Filter"] !== undefined) {
        contents.Filter = de_IntelligentTieringFilter(output["Filter"], context);
    }
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    if (output.Tiering === "") {
        contents.Tierings = [];
    }
    else if (output["Tiering"] !== undefined) {
        contents.Tierings = de_TieringList(__getArrayIfSingleItem(output["Tiering"]), context);
    }
    return contents;
};
const de_IntelligentTieringConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_IntelligentTieringConfiguration(entry, context);
    });
};
const de_IntelligentTieringFilter = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output["Tag"] !== undefined) {
        contents.Tag = de_Tag(output["Tag"], context);
    }
    if (output["And"] !== undefined) {
        contents.And = de_IntelligentTieringAndOperator(output["And"], context);
    }
    return contents;
};
const de_InventoryConfiguration = (output, context) => {
    const contents = {};
    if (output["Destination"] !== undefined) {
        contents.Destination = de_InventoryDestination(output["Destination"], context);
    }
    if (output["IsEnabled"] !== undefined) {
        contents.IsEnabled = __parseBoolean(output["IsEnabled"]);
    }
    if (output["Filter"] !== undefined) {
        contents.Filter = de_InventoryFilter(output["Filter"], context);
    }
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output["IncludedObjectVersions"] !== undefined) {
        contents.IncludedObjectVersions = __expectString(output["IncludedObjectVersions"]);
    }
    if (output.OptionalFields === "") {
        contents.OptionalFields = [];
    }
    else if (output["OptionalFields"] !== undefined && output["OptionalFields"]["Field"] !== undefined) {
        contents.OptionalFields = de_InventoryOptionalFields(__getArrayIfSingleItem(output["OptionalFields"]["Field"]), context);
    }
    if (output["Schedule"] !== undefined) {
        contents.Schedule = de_InventorySchedule(output["Schedule"], context);
    }
    return contents;
};
const de_InventoryConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_InventoryConfiguration(entry, context);
    });
};
const de_InventoryDestination = (output, context) => {
    const contents = {};
    if (output["S3BucketDestination"] !== undefined) {
        contents.S3BucketDestination = de_InventoryS3BucketDestination(output["S3BucketDestination"], context);
    }
    return contents;
};
const de_InventoryEncryption = (output, context) => {
    const contents = {};
    if (output["SSE-S3"] !== undefined) {
        contents.SSES3 = de_SSES3(output["SSE-S3"], context);
    }
    if (output["SSE-KMS"] !== undefined) {
        contents.SSEKMS = de_SSEKMS(output["SSE-KMS"], context);
    }
    return contents;
};
const de_InventoryFilter = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    return contents;
};
const de_InventoryOptionalFields = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return __expectString(entry);
    });
};
const de_InventoryS3BucketDestination = (output, context) => {
    const contents = {};
    if (output["AccountId"] !== undefined) {
        contents.AccountId = __expectString(output["AccountId"]);
    }
    if (output["Bucket"] !== undefined) {
        contents.Bucket = __expectString(output["Bucket"]);
    }
    if (output["Format"] !== undefined) {
        contents.Format = __expectString(output["Format"]);
    }
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output["Encryption"] !== undefined) {
        contents.Encryption = de_InventoryEncryption(output["Encryption"], context);
    }
    return contents;
};
const de_InventorySchedule = (output, context) => {
    const contents = {};
    if (output["Frequency"] !== undefined) {
        contents.Frequency = __expectString(output["Frequency"]);
    }
    return contents;
};
const de_LambdaFunctionConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output["CloudFunction"] !== undefined) {
        contents.LambdaFunctionArn = __expectString(output["CloudFunction"]);
    }
    if (output.Event === "") {
        contents.Events = [];
    }
    else if (output["Event"] !== undefined) {
        contents.Events = de_EventList(__getArrayIfSingleItem(output["Event"]), context);
    }
    if (output["Filter"] !== undefined) {
        contents.Filter = de_NotificationConfigurationFilter(output["Filter"], context);
    }
    return contents;
};
const de_LambdaFunctionConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_LambdaFunctionConfiguration(entry, context);
    });
};
const de_LifecycleExpiration = (output, context) => {
    const contents = {};
    if (output["Date"] !== undefined) {
        contents.Date = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["Date"]));
    }
    if (output["Days"] !== undefined) {
        contents.Days = __strictParseInt32(output["Days"]);
    }
    if (output["ExpiredObjectDeleteMarker"] !== undefined) {
        contents.ExpiredObjectDeleteMarker = __parseBoolean(output["ExpiredObjectDeleteMarker"]);
    }
    return contents;
};
const de_LifecycleRule = (output, context) => {
    const contents = {};
    if (output["Expiration"] !== undefined) {
        contents.Expiration = de_LifecycleExpiration(output["Expiration"], context);
    }
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Filter === "") {
    }
    else if (output["Filter"] !== undefined) {
        contents.Filter = de_LifecycleRuleFilter(__expectUnion(output["Filter"]), context);
    }
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    if (output.Transition === "") {
        contents.Transitions = [];
    }
    else if (output["Transition"] !== undefined) {
        contents.Transitions = de_TransitionList(__getArrayIfSingleItem(output["Transition"]), context);
    }
    if (output.NoncurrentVersionTransition === "") {
        contents.NoncurrentVersionTransitions = [];
    }
    else if (output["NoncurrentVersionTransition"] !== undefined) {
        contents.NoncurrentVersionTransitions = de_NoncurrentVersionTransitionList(__getArrayIfSingleItem(output["NoncurrentVersionTransition"]), context);
    }
    if (output["NoncurrentVersionExpiration"] !== undefined) {
        contents.NoncurrentVersionExpiration = de_NoncurrentVersionExpiration(output["NoncurrentVersionExpiration"], context);
    }
    if (output["AbortIncompleteMultipartUpload"] !== undefined) {
        contents.AbortIncompleteMultipartUpload = de_AbortIncompleteMultipartUpload(output["AbortIncompleteMultipartUpload"], context);
    }
    return contents;
};
const de_LifecycleRuleAndOperator = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Tag === "") {
        contents.Tags = [];
    }
    else if (output["Tag"] !== undefined) {
        contents.Tags = de_TagSet(__getArrayIfSingleItem(output["Tag"]), context);
    }
    if (output["ObjectSizeGreaterThan"] !== undefined) {
        contents.ObjectSizeGreaterThan = __strictParseLong(output["ObjectSizeGreaterThan"]);
    }
    if (output["ObjectSizeLessThan"] !== undefined) {
        contents.ObjectSizeLessThan = __strictParseLong(output["ObjectSizeLessThan"]);
    }
    return contents;
};
const de_LifecycleRuleFilter = (output, context) => {
    if (output["Prefix"] !== undefined) {
        return {
            Prefix: __expectString(output["Prefix"]),
        };
    }
    if (output["Tag"] !== undefined) {
        return {
            Tag: de_Tag(output["Tag"], context),
        };
    }
    if (output["ObjectSizeGreaterThan"] !== undefined) {
        return {
            ObjectSizeGreaterThan: __strictParseLong(output["ObjectSizeGreaterThan"]),
        };
    }
    if (output["ObjectSizeLessThan"] !== undefined) {
        return {
            ObjectSizeLessThan: __strictParseLong(output["ObjectSizeLessThan"]),
        };
    }
    if (output["And"] !== undefined) {
        return {
            And: de_LifecycleRuleAndOperator(output["And"], context),
        };
    }
    return { $unknown: Object.entries(output)[0] };
};
const de_LifecycleRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_LifecycleRule(entry, context);
    });
};
const de_LoggingEnabled = (output, context) => {
    const contents = {};
    if (output["TargetBucket"] !== undefined) {
        contents.TargetBucket = __expectString(output["TargetBucket"]);
    }
    if (output.TargetGrants === "") {
        contents.TargetGrants = [];
    }
    else if (output["TargetGrants"] !== undefined && output["TargetGrants"]["Grant"] !== undefined) {
        contents.TargetGrants = de_TargetGrants(__getArrayIfSingleItem(output["TargetGrants"]["Grant"]), context);
    }
    if (output["TargetPrefix"] !== undefined) {
        contents.TargetPrefix = __expectString(output["TargetPrefix"]);
    }
    return contents;
};
const de_Metrics = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    if (output["EventThreshold"] !== undefined) {
        contents.EventThreshold = de_ReplicationTimeValue(output["EventThreshold"], context);
    }
    return contents;
};
const de_MetricsAndOperator = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Tag === "") {
        contents.Tags = [];
    }
    else if (output["Tag"] !== undefined) {
        contents.Tags = de_TagSet(__getArrayIfSingleItem(output["Tag"]), context);
    }
    if (output["AccessPointArn"] !== undefined) {
        contents.AccessPointArn = __expectString(output["AccessPointArn"]);
    }
    return contents;
};
const de_MetricsConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output.Filter === "") {
    }
    else if (output["Filter"] !== undefined) {
        contents.Filter = de_MetricsFilter(__expectUnion(output["Filter"]), context);
    }
    return contents;
};
const de_MetricsConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_MetricsConfiguration(entry, context);
    });
};
const de_MetricsFilter = (output, context) => {
    if (output["Prefix"] !== undefined) {
        return {
            Prefix: __expectString(output["Prefix"]),
        };
    }
    if (output["Tag"] !== undefined) {
        return {
            Tag: de_Tag(output["Tag"], context),
        };
    }
    if (output["AccessPointArn"] !== undefined) {
        return {
            AccessPointArn: __expectString(output["AccessPointArn"]),
        };
    }
    if (output["And"] !== undefined) {
        return {
            And: de_MetricsAndOperator(output["And"], context),
        };
    }
    return { $unknown: Object.entries(output)[0] };
};
const de_MultipartUpload = (output, context) => {
    const contents = {};
    if (output["UploadId"] !== undefined) {
        contents.UploadId = __expectString(output["UploadId"]);
    }
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["Initiated"] !== undefined) {
        contents.Initiated = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["Initiated"]));
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    if (output["Owner"] !== undefined) {
        contents.Owner = de_Owner(output["Owner"], context);
    }
    if (output["Initiator"] !== undefined) {
        contents.Initiator = de_Initiator(output["Initiator"], context);
    }
    if (output["ChecksumAlgorithm"] !== undefined) {
        contents.ChecksumAlgorithm = __expectString(output["ChecksumAlgorithm"]);
    }
    return contents;
};
const de_MultipartUploadList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_MultipartUpload(entry, context);
    });
};
const de_NoncurrentVersionExpiration = (output, context) => {
    const contents = {};
    if (output["NoncurrentDays"] !== undefined) {
        contents.NoncurrentDays = __strictParseInt32(output["NoncurrentDays"]);
    }
    if (output["NewerNoncurrentVersions"] !== undefined) {
        contents.NewerNoncurrentVersions = __strictParseInt32(output["NewerNoncurrentVersions"]);
    }
    return contents;
};
const de_NoncurrentVersionTransition = (output, context) => {
    const contents = {};
    if (output["NoncurrentDays"] !== undefined) {
        contents.NoncurrentDays = __strictParseInt32(output["NoncurrentDays"]);
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    if (output["NewerNoncurrentVersions"] !== undefined) {
        contents.NewerNoncurrentVersions = __strictParseInt32(output["NewerNoncurrentVersions"]);
    }
    return contents;
};
const de_NoncurrentVersionTransitionList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_NoncurrentVersionTransition(entry, context);
    });
};
const de_NotificationConfigurationFilter = (output, context) => {
    const contents = {};
    if (output["S3Key"] !== undefined) {
        contents.Key = de_S3KeyFilter(output["S3Key"], context);
    }
    return contents;
};
const de__Object = (output, context) => {
    const contents = {};
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    if (output["ETag"] !== undefined) {
        contents.ETag = __expectString(output["ETag"]);
    }
    if (output.ChecksumAlgorithm === "") {
        contents.ChecksumAlgorithm = [];
    }
    else if (output["ChecksumAlgorithm"] !== undefined) {
        contents.ChecksumAlgorithm = de_ChecksumAlgorithmList(__getArrayIfSingleItem(output["ChecksumAlgorithm"]), context);
    }
    if (output["Size"] !== undefined) {
        contents.Size = __strictParseLong(output["Size"]);
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    if (output["Owner"] !== undefined) {
        contents.Owner = de_Owner(output["Owner"], context);
    }
    if (output["RestoreStatus"] !== undefined) {
        contents.RestoreStatus = de_RestoreStatus(output["RestoreStatus"], context);
    }
    return contents;
};
const de_ObjectList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de__Object(entry, context);
    });
};
const de_ObjectLockConfiguration = (output, context) => {
    const contents = {};
    if (output["ObjectLockEnabled"] !== undefined) {
        contents.ObjectLockEnabled = __expectString(output["ObjectLockEnabled"]);
    }
    if (output["Rule"] !== undefined) {
        contents.Rule = de_ObjectLockRule(output["Rule"], context);
    }
    return contents;
};
const de_ObjectLockLegalHold = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    return contents;
};
const de_ObjectLockRetention = (output, context) => {
    const contents = {};
    if (output["Mode"] !== undefined) {
        contents.Mode = __expectString(output["Mode"]);
    }
    if (output["RetainUntilDate"] !== undefined) {
        contents.RetainUntilDate = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["RetainUntilDate"]));
    }
    return contents;
};
const de_ObjectLockRule = (output, context) => {
    const contents = {};
    if (output["DefaultRetention"] !== undefined) {
        contents.DefaultRetention = de_DefaultRetention(output["DefaultRetention"], context);
    }
    return contents;
};
const de_ObjectPart = (output, context) => {
    const contents = {};
    if (output["PartNumber"] !== undefined) {
        contents.PartNumber = __strictParseInt32(output["PartNumber"]);
    }
    if (output["Size"] !== undefined) {
        contents.Size = __strictParseLong(output["Size"]);
    }
    if (output["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(output["ChecksumCRC32"]);
    }
    if (output["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(output["ChecksumCRC32C"]);
    }
    if (output["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(output["ChecksumSHA1"]);
    }
    if (output["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(output["ChecksumSHA256"]);
    }
    return contents;
};
const de_ObjectVersion = (output, context) => {
    const contents = {};
    if (output["ETag"] !== undefined) {
        contents.ETag = __expectString(output["ETag"]);
    }
    if (output.ChecksumAlgorithm === "") {
        contents.ChecksumAlgorithm = [];
    }
    else if (output["ChecksumAlgorithm"] !== undefined) {
        contents.ChecksumAlgorithm = de_ChecksumAlgorithmList(__getArrayIfSingleItem(output["ChecksumAlgorithm"]), context);
    }
    if (output["Size"] !== undefined) {
        contents.Size = __strictParseLong(output["Size"]);
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["VersionId"] !== undefined) {
        contents.VersionId = __expectString(output["VersionId"]);
    }
    if (output["IsLatest"] !== undefined) {
        contents.IsLatest = __parseBoolean(output["IsLatest"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    if (output["Owner"] !== undefined) {
        contents.Owner = de_Owner(output["Owner"], context);
    }
    if (output["RestoreStatus"] !== undefined) {
        contents.RestoreStatus = de_RestoreStatus(output["RestoreStatus"], context);
    }
    return contents;
};
const de_ObjectVersionList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_ObjectVersion(entry, context);
    });
};
const de_Owner = (output, context) => {
    const contents = {};
    if (output["DisplayName"] !== undefined) {
        contents.DisplayName = __expectString(output["DisplayName"]);
    }
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    return contents;
};
const de_OwnershipControls = (output, context) => {
    const contents = {};
    if (output.Rule === "") {
        contents.Rules = [];
    }
    else if (output["Rule"] !== undefined) {
        contents.Rules = de_OwnershipControlsRules(__getArrayIfSingleItem(output["Rule"]), context);
    }
    return contents;
};
const de_OwnershipControlsRule = (output, context) => {
    const contents = {};
    if (output["ObjectOwnership"] !== undefined) {
        contents.ObjectOwnership = __expectString(output["ObjectOwnership"]);
    }
    return contents;
};
const de_OwnershipControlsRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_OwnershipControlsRule(entry, context);
    });
};
const de_Part = (output, context) => {
    const contents = {};
    if (output["PartNumber"] !== undefined) {
        contents.PartNumber = __strictParseInt32(output["PartNumber"]);
    }
    if (output["LastModified"] !== undefined) {
        contents.LastModified = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["LastModified"]));
    }
    if (output["ETag"] !== undefined) {
        contents.ETag = __expectString(output["ETag"]);
    }
    if (output["Size"] !== undefined) {
        contents.Size = __strictParseLong(output["Size"]);
    }
    if (output["ChecksumCRC32"] !== undefined) {
        contents.ChecksumCRC32 = __expectString(output["ChecksumCRC32"]);
    }
    if (output["ChecksumCRC32C"] !== undefined) {
        contents.ChecksumCRC32C = __expectString(output["ChecksumCRC32C"]);
    }
    if (output["ChecksumSHA1"] !== undefined) {
        contents.ChecksumSHA1 = __expectString(output["ChecksumSHA1"]);
    }
    if (output["ChecksumSHA256"] !== undefined) {
        contents.ChecksumSHA256 = __expectString(output["ChecksumSHA256"]);
    }
    return contents;
};
const de_Parts = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Part(entry, context);
    });
};
const de_PartsList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_ObjectPart(entry, context);
    });
};
const de_PolicyStatus = (output, context) => {
    const contents = {};
    if (output["IsPublic"] !== undefined) {
        contents.IsPublic = __parseBoolean(output["IsPublic"]);
    }
    return contents;
};
const de_Progress = (output, context) => {
    const contents = {};
    if (output["BytesScanned"] !== undefined) {
        contents.BytesScanned = __strictParseLong(output["BytesScanned"]);
    }
    if (output["BytesProcessed"] !== undefined) {
        contents.BytesProcessed = __strictParseLong(output["BytesProcessed"]);
    }
    if (output["BytesReturned"] !== undefined) {
        contents.BytesReturned = __strictParseLong(output["BytesReturned"]);
    }
    return contents;
};
const de_PublicAccessBlockConfiguration = (output, context) => {
    const contents = {};
    if (output["BlockPublicAcls"] !== undefined) {
        contents.BlockPublicAcls = __parseBoolean(output["BlockPublicAcls"]);
    }
    if (output["IgnorePublicAcls"] !== undefined) {
        contents.IgnorePublicAcls = __parseBoolean(output["IgnorePublicAcls"]);
    }
    if (output["BlockPublicPolicy"] !== undefined) {
        contents.BlockPublicPolicy = __parseBoolean(output["BlockPublicPolicy"]);
    }
    if (output["RestrictPublicBuckets"] !== undefined) {
        contents.RestrictPublicBuckets = __parseBoolean(output["RestrictPublicBuckets"]);
    }
    return contents;
};
const de_QueueConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output["Queue"] !== undefined) {
        contents.QueueArn = __expectString(output["Queue"]);
    }
    if (output.Event === "") {
        contents.Events = [];
    }
    else if (output["Event"] !== undefined) {
        contents.Events = de_EventList(__getArrayIfSingleItem(output["Event"]), context);
    }
    if (output["Filter"] !== undefined) {
        contents.Filter = de_NotificationConfigurationFilter(output["Filter"], context);
    }
    return contents;
};
const de_QueueConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_QueueConfiguration(entry, context);
    });
};
const de_Redirect = (output, context) => {
    const contents = {};
    if (output["HostName"] !== undefined) {
        contents.HostName = __expectString(output["HostName"]);
    }
    if (output["HttpRedirectCode"] !== undefined) {
        contents.HttpRedirectCode = __expectString(output["HttpRedirectCode"]);
    }
    if (output["Protocol"] !== undefined) {
        contents.Protocol = __expectString(output["Protocol"]);
    }
    if (output["ReplaceKeyPrefixWith"] !== undefined) {
        contents.ReplaceKeyPrefixWith = __expectString(output["ReplaceKeyPrefixWith"]);
    }
    if (output["ReplaceKeyWith"] !== undefined) {
        contents.ReplaceKeyWith = __expectString(output["ReplaceKeyWith"]);
    }
    return contents;
};
const de_RedirectAllRequestsTo = (output, context) => {
    const contents = {};
    if (output["HostName"] !== undefined) {
        contents.HostName = __expectString(output["HostName"]);
    }
    if (output["Protocol"] !== undefined) {
        contents.Protocol = __expectString(output["Protocol"]);
    }
    return contents;
};
const de_ReplicaModifications = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    return contents;
};
const de_ReplicationConfiguration = (output, context) => {
    const contents = {};
    if (output["Role"] !== undefined) {
        contents.Role = __expectString(output["Role"]);
    }
    if (output.Rule === "") {
        contents.Rules = [];
    }
    else if (output["Rule"] !== undefined) {
        contents.Rules = de_ReplicationRules(__getArrayIfSingleItem(output["Rule"]), context);
    }
    return contents;
};
const de_ReplicationRule = (output, context) => {
    const contents = {};
    if (output["ID"] !== undefined) {
        contents.ID = __expectString(output["ID"]);
    }
    if (output["Priority"] !== undefined) {
        contents.Priority = __strictParseInt32(output["Priority"]);
    }
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Filter === "") {
    }
    else if (output["Filter"] !== undefined) {
        contents.Filter = de_ReplicationRuleFilter(__expectUnion(output["Filter"]), context);
    }
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    if (output["SourceSelectionCriteria"] !== undefined) {
        contents.SourceSelectionCriteria = de_SourceSelectionCriteria(output["SourceSelectionCriteria"], context);
    }
    if (output["ExistingObjectReplication"] !== undefined) {
        contents.ExistingObjectReplication = de_ExistingObjectReplication(output["ExistingObjectReplication"], context);
    }
    if (output["Destination"] !== undefined) {
        contents.Destination = de_Destination(output["Destination"], context);
    }
    if (output["DeleteMarkerReplication"] !== undefined) {
        contents.DeleteMarkerReplication = de_DeleteMarkerReplication(output["DeleteMarkerReplication"], context);
    }
    return contents;
};
const de_ReplicationRuleAndOperator = (output, context) => {
    const contents = {};
    if (output["Prefix"] !== undefined) {
        contents.Prefix = __expectString(output["Prefix"]);
    }
    if (output.Tag === "") {
        contents.Tags = [];
    }
    else if (output["Tag"] !== undefined) {
        contents.Tags = de_TagSet(__getArrayIfSingleItem(output["Tag"]), context);
    }
    return contents;
};
const de_ReplicationRuleFilter = (output, context) => {
    if (output["Prefix"] !== undefined) {
        return {
            Prefix: __expectString(output["Prefix"]),
        };
    }
    if (output["Tag"] !== undefined) {
        return {
            Tag: de_Tag(output["Tag"], context),
        };
    }
    if (output["And"] !== undefined) {
        return {
            And: de_ReplicationRuleAndOperator(output["And"], context),
        };
    }
    return { $unknown: Object.entries(output)[0] };
};
const de_ReplicationRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_ReplicationRule(entry, context);
    });
};
const de_ReplicationTime = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    if (output["Time"] !== undefined) {
        contents.Time = de_ReplicationTimeValue(output["Time"], context);
    }
    return contents;
};
const de_ReplicationTimeValue = (output, context) => {
    const contents = {};
    if (output["Minutes"] !== undefined) {
        contents.Minutes = __strictParseInt32(output["Minutes"]);
    }
    return contents;
};
const de_RestoreStatus = (output, context) => {
    const contents = {};
    if (output["IsRestoreInProgress"] !== undefined) {
        contents.IsRestoreInProgress = __parseBoolean(output["IsRestoreInProgress"]);
    }
    if (output["RestoreExpiryDate"] !== undefined) {
        contents.RestoreExpiryDate = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["RestoreExpiryDate"]));
    }
    return contents;
};
const de_RoutingRule = (output, context) => {
    const contents = {};
    if (output["Condition"] !== undefined) {
        contents.Condition = de_Condition(output["Condition"], context);
    }
    if (output["Redirect"] !== undefined) {
        contents.Redirect = de_Redirect(output["Redirect"], context);
    }
    return contents;
};
const de_RoutingRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_RoutingRule(entry, context);
    });
};
const de_S3KeyFilter = (output, context) => {
    const contents = {};
    if (output.FilterRule === "") {
        contents.FilterRules = [];
    }
    else if (output["FilterRule"] !== undefined) {
        contents.FilterRules = de_FilterRuleList(__getArrayIfSingleItem(output["FilterRule"]), context);
    }
    return contents;
};
const de_ServerSideEncryptionByDefault = (output, context) => {
    const contents = {};
    if (output["SSEAlgorithm"] !== undefined) {
        contents.SSEAlgorithm = __expectString(output["SSEAlgorithm"]);
    }
    if (output["KMSMasterKeyID"] !== undefined) {
        contents.KMSMasterKeyID = __expectString(output["KMSMasterKeyID"]);
    }
    return contents;
};
const de_ServerSideEncryptionConfiguration = (output, context) => {
    const contents = {};
    if (output.Rule === "") {
        contents.Rules = [];
    }
    else if (output["Rule"] !== undefined) {
        contents.Rules = de_ServerSideEncryptionRules(__getArrayIfSingleItem(output["Rule"]), context);
    }
    return contents;
};
const de_ServerSideEncryptionRule = (output, context) => {
    const contents = {};
    if (output["ApplyServerSideEncryptionByDefault"] !== undefined) {
        contents.ApplyServerSideEncryptionByDefault = de_ServerSideEncryptionByDefault(output["ApplyServerSideEncryptionByDefault"], context);
    }
    if (output["BucketKeyEnabled"] !== undefined) {
        contents.BucketKeyEnabled = __parseBoolean(output["BucketKeyEnabled"]);
    }
    return contents;
};
const de_ServerSideEncryptionRules = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_ServerSideEncryptionRule(entry, context);
    });
};
const de_SourceSelectionCriteria = (output, context) => {
    const contents = {};
    if (output["SseKmsEncryptedObjects"] !== undefined) {
        contents.SseKmsEncryptedObjects = de_SseKmsEncryptedObjects(output["SseKmsEncryptedObjects"], context);
    }
    if (output["ReplicaModifications"] !== undefined) {
        contents.ReplicaModifications = de_ReplicaModifications(output["ReplicaModifications"], context);
    }
    return contents;
};
const de_SSEKMS = (output, context) => {
    const contents = {};
    if (output["KeyId"] !== undefined) {
        contents.KeyId = __expectString(output["KeyId"]);
    }
    return contents;
};
const de_SseKmsEncryptedObjects = (output, context) => {
    const contents = {};
    if (output["Status"] !== undefined) {
        contents.Status = __expectString(output["Status"]);
    }
    return contents;
};
const de_SSES3 = (output, context) => {
    const contents = {};
    return contents;
};
const de_Stats = (output, context) => {
    const contents = {};
    if (output["BytesScanned"] !== undefined) {
        contents.BytesScanned = __strictParseLong(output["BytesScanned"]);
    }
    if (output["BytesProcessed"] !== undefined) {
        contents.BytesProcessed = __strictParseLong(output["BytesProcessed"]);
    }
    if (output["BytesReturned"] !== undefined) {
        contents.BytesReturned = __strictParseLong(output["BytesReturned"]);
    }
    return contents;
};
const de_StorageClassAnalysis = (output, context) => {
    const contents = {};
    if (output["DataExport"] !== undefined) {
        contents.DataExport = de_StorageClassAnalysisDataExport(output["DataExport"], context);
    }
    return contents;
};
const de_StorageClassAnalysisDataExport = (output, context) => {
    const contents = {};
    if (output["OutputSchemaVersion"] !== undefined) {
        contents.OutputSchemaVersion = __expectString(output["OutputSchemaVersion"]);
    }
    if (output["Destination"] !== undefined) {
        contents.Destination = de_AnalyticsExportDestination(output["Destination"], context);
    }
    return contents;
};
const de_Tag = (output, context) => {
    const contents = {};
    if (output["Key"] !== undefined) {
        contents.Key = __expectString(output["Key"]);
    }
    if (output["Value"] !== undefined) {
        contents.Value = __expectString(output["Value"]);
    }
    return contents;
};
const de_TagSet = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Tag(entry, context);
    });
};
const de_TargetGrant = (output, context) => {
    const contents = {};
    if (output["Grantee"] !== undefined) {
        contents.Grantee = de_Grantee(output["Grantee"], context);
    }
    if (output["Permission"] !== undefined) {
        contents.Permission = __expectString(output["Permission"]);
    }
    return contents;
};
const de_TargetGrants = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_TargetGrant(entry, context);
    });
};
const de_Tiering = (output, context) => {
    const contents = {};
    if (output["Days"] !== undefined) {
        contents.Days = __strictParseInt32(output["Days"]);
    }
    if (output["AccessTier"] !== undefined) {
        contents.AccessTier = __expectString(output["AccessTier"]);
    }
    return contents;
};
const de_TieringList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Tiering(entry, context);
    });
};
const de_TopicConfiguration = (output, context) => {
    const contents = {};
    if (output["Id"] !== undefined) {
        contents.Id = __expectString(output["Id"]);
    }
    if (output["Topic"] !== undefined) {
        contents.TopicArn = __expectString(output["Topic"]);
    }
    if (output.Event === "") {
        contents.Events = [];
    }
    else if (output["Event"] !== undefined) {
        contents.Events = de_EventList(__getArrayIfSingleItem(output["Event"]), context);
    }
    if (output["Filter"] !== undefined) {
        contents.Filter = de_NotificationConfigurationFilter(output["Filter"], context);
    }
    return contents;
};
const de_TopicConfigurationList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_TopicConfiguration(entry, context);
    });
};
const de_Transition = (output, context) => {
    const contents = {};
    if (output["Date"] !== undefined) {
        contents.Date = __expectNonNull(__parseRfc3339DateTimeWithOffset(output["Date"]));
    }
    if (output["Days"] !== undefined) {
        contents.Days = __strictParseInt32(output["Days"]);
    }
    if (output["StorageClass"] !== undefined) {
        contents.StorageClass = __expectString(output["StorageClass"]);
    }
    return contents;
};
const de_TransitionList = (output, context) => {
    return (output || [])
        .filter((e) => e != null)
        .map((entry) => {
        return de_Transition(entry, context);
    });
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});
const collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => context.utf8Encoder(body));
const isSerializableHeaderValue = (value) => value !== undefined &&
    value !== null &&
    value !== "" &&
    (!Object.getOwnPropertyNames(value).includes("length") || value.length != 0) &&
    (!Object.getOwnPropertyNames(value).includes("size") || value.size != 0);
const parseBody = (streamBody, context) => collectBodyString(streamBody, context).then((encoded) => {
    if (encoded.length) {
        const parser = new XMLParser({
            attributeNamePrefix: "",
            htmlEntities: true,
            ignoreAttributes: false,
            ignoreDeclaration: true,
            parseTagValue: false,
            trimValues: false,
            tagValueProcessor: (_, val) => (val.trim() === "" && val.includes("\n") ? "" : undefined),
        });
        parser.addEntity("#xD", "\r");
        parser.addEntity("#10", "\n");
        const parsedObj = parser.parse(encoded);
        const textNodeName = "#text";
        const key = Object.keys(parsedObj)[0];
        const parsedObjToReturn = parsedObj[key];
        if (parsedObjToReturn[textNodeName]) {
            parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
            delete parsedObjToReturn[textNodeName];
        }
        return __getValueFromTextNode(parsedObjToReturn);
    }
    return {};
});
const parseErrorBody = async (errorBody, context) => {
    const value = await parseBody(errorBody, context);
    if (value.Error) {
        value.Error.message = value.Error.message ?? value.Error.Message;
    }
    return value;
};
const loadRestXmlErrorCode = (output, data) => {
    if (data?.Code !== undefined) {
        return data.Code;
    }
    if (output.statusCode == 404) {
        return "NotFound";
    }
};
