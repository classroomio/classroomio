"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveClientEndpointParameters = void 0;
const resolveClientEndpointParameters = (options) => {
    return {
        ...options,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        forcePathStyle: options.forcePathStyle ?? false,
        useAccelerateEndpoint: options.useAccelerateEndpoint ?? false,
        useGlobalEndpoint: options.useGlobalEndpoint ?? false,
        disableMultiregionAccessPoints: options.disableMultiregionAccessPoints ?? false,
        defaultSigningName: "s3",
    };
};
exports.resolveClientEndpointParameters = resolveClientEndpointParameters;
