"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteGetObjectResponseRequestFilterSensitiveLog = exports.UploadPartCopyRequestFilterSensitiveLog = exports.UploadPartCopyOutputFilterSensitiveLog = exports.UploadPartRequestFilterSensitiveLog = exports.UploadPartOutputFilterSensitiveLog = exports.SelectObjectContentRequestFilterSensitiveLog = exports.SelectObjectContentOutputFilterSensitiveLog = exports.SelectObjectContentEventStreamFilterSensitiveLog = exports.RestoreObjectRequestFilterSensitiveLog = exports.RestoreRequestFilterSensitiveLog = exports.OutputLocationFilterSensitiveLog = exports.S3LocationFilterSensitiveLog = exports.EncryptionFilterSensitiveLog = exports.SelectObjectContentEventStream = exports.RestoreRequestType = exports.QuoteFields = exports.JSONType = exports.FileHeaderInfo = exports.CompressionType = exports.ExpressionType = exports.Tier = exports.ObjectAlreadyInActiveTierError = void 0;
const smithy_client_1 = require("@smithy/smithy-client");
const S3ServiceException_1 = require("./S3ServiceException");
class ObjectAlreadyInActiveTierError extends S3ServiceException_1.S3ServiceException {
    constructor(opts) {
        super({
            name: "ObjectAlreadyInActiveTierError",
            $fault: "client",
            ...opts,
        });
        this.name = "ObjectAlreadyInActiveTierError";
        this.$fault = "client";
        Object.setPrototypeOf(this, ObjectAlreadyInActiveTierError.prototype);
    }
}
exports.ObjectAlreadyInActiveTierError = ObjectAlreadyInActiveTierError;
exports.Tier = {
    Bulk: "Bulk",
    Expedited: "Expedited",
    Standard: "Standard",
};
exports.ExpressionType = {
    SQL: "SQL",
};
exports.CompressionType = {
    BZIP2: "BZIP2",
    GZIP: "GZIP",
    NONE: "NONE",
};
exports.FileHeaderInfo = {
    IGNORE: "IGNORE",
    NONE: "NONE",
    USE: "USE",
};
exports.JSONType = {
    DOCUMENT: "DOCUMENT",
    LINES: "LINES",
};
exports.QuoteFields = {
    ALWAYS: "ALWAYS",
    ASNEEDED: "ASNEEDED",
};
exports.RestoreRequestType = {
    SELECT: "SELECT",
};
var SelectObjectContentEventStream;
(function (SelectObjectContentEventStream) {
    SelectObjectContentEventStream.visit = (value, visitor) => {
        if (value.Records !== undefined)
            return visitor.Records(value.Records);
        if (value.Stats !== undefined)
            return visitor.Stats(value.Stats);
        if (value.Progress !== undefined)
            return visitor.Progress(value.Progress);
        if (value.Cont !== undefined)
            return visitor.Cont(value.Cont);
        if (value.End !== undefined)
            return visitor.End(value.End);
        return visitor._(value.$unknown[0], value.$unknown[1]);
    };
})(SelectObjectContentEventStream = exports.SelectObjectContentEventStream || (exports.SelectObjectContentEventStream = {}));
const EncryptionFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.KMSKeyId && { KMSKeyId: smithy_client_1.SENSITIVE_STRING }),
});
exports.EncryptionFilterSensitiveLog = EncryptionFilterSensitiveLog;
const S3LocationFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Encryption && { Encryption: (0, exports.EncryptionFilterSensitiveLog)(obj.Encryption) }),
});
exports.S3LocationFilterSensitiveLog = S3LocationFilterSensitiveLog;
const OutputLocationFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.S3 && { S3: (0, exports.S3LocationFilterSensitiveLog)(obj.S3) }),
});
exports.OutputLocationFilterSensitiveLog = OutputLocationFilterSensitiveLog;
const RestoreRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.OutputLocation && { OutputLocation: (0, exports.OutputLocationFilterSensitiveLog)(obj.OutputLocation) }),
});
exports.RestoreRequestFilterSensitiveLog = RestoreRequestFilterSensitiveLog;
const RestoreObjectRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.RestoreRequest && { RestoreRequest: (0, exports.RestoreRequestFilterSensitiveLog)(obj.RestoreRequest) }),
});
exports.RestoreObjectRequestFilterSensitiveLog = RestoreObjectRequestFilterSensitiveLog;
const SelectObjectContentEventStreamFilterSensitiveLog = (obj) => {
    if (obj.Records !== undefined)
        return { Records: obj.Records };
    if (obj.Stats !== undefined)
        return { Stats: obj.Stats };
    if (obj.Progress !== undefined)
        return { Progress: obj.Progress };
    if (obj.Cont !== undefined)
        return { Cont: obj.Cont };
    if (obj.End !== undefined)
        return { End: obj.End };
    if (obj.$unknown !== undefined)
        return { [obj.$unknown[0]]: "UNKNOWN" };
};
exports.SelectObjectContentEventStreamFilterSensitiveLog = SelectObjectContentEventStreamFilterSensitiveLog;
const SelectObjectContentOutputFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Payload && { Payload: "STREAMING_CONTENT" }),
});
exports.SelectObjectContentOutputFilterSensitiveLog = SelectObjectContentOutputFilterSensitiveLog;
const SelectObjectContentRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSECustomerKey && { SSECustomerKey: smithy_client_1.SENSITIVE_STRING }),
});
exports.SelectObjectContentRequestFilterSensitiveLog = SelectObjectContentRequestFilterSensitiveLog;
const UploadPartOutputFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSEKMSKeyId && { SSEKMSKeyId: smithy_client_1.SENSITIVE_STRING }),
});
exports.UploadPartOutputFilterSensitiveLog = UploadPartOutputFilterSensitiveLog;
const UploadPartRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSECustomerKey && { SSECustomerKey: smithy_client_1.SENSITIVE_STRING }),
});
exports.UploadPartRequestFilterSensitiveLog = UploadPartRequestFilterSensitiveLog;
const UploadPartCopyOutputFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSEKMSKeyId && { SSEKMSKeyId: smithy_client_1.SENSITIVE_STRING }),
});
exports.UploadPartCopyOutputFilterSensitiveLog = UploadPartCopyOutputFilterSensitiveLog;
const UploadPartCopyRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSECustomerKey && { SSECustomerKey: smithy_client_1.SENSITIVE_STRING }),
    ...(obj.CopySourceSSECustomerKey && { CopySourceSSECustomerKey: smithy_client_1.SENSITIVE_STRING }),
});
exports.UploadPartCopyRequestFilterSensitiveLog = UploadPartCopyRequestFilterSensitiveLog;
const WriteGetObjectResponseRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SSEKMSKeyId && { SSEKMSKeyId: smithy_client_1.SENSITIVE_STRING }),
});
exports.WriteGetObjectResponseRequestFilterSensitiveLog = WriteGetObjectResponseRequestFilterSensitiveLog;
