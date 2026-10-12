"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_CONTEXT_METADATA_KEY = exports.RequestContext = void 0;
exports.serializeRequestContext = serializeRequestContext;
exports.deserializeRequestContext = deserializeRequestContext;
exports.requireMerchant = requireMerchant;
exports.extractIdentity = extractIdentity;
exports.createServerCredentials = createServerCredentials;
exports.createClientCredentials = createClientCredentials;
exports.applyAuthInterceptor = applyAuthInterceptor;
const grpc = __importStar(require("@grpc/grpc-js"));
const fs = __importStar(require("fs"));
const context_1 = require("@payment-gateway/protobuf/dist/generated/context");
var context_2 = require("@payment-gateway/protobuf/dist/generated/context");
Object.defineProperty(exports, "RequestContext", { enumerable: true, get: function () { return context_2.RequestContext; } });
// ─── Context Metadata Key ───────────────────────────────────────────────────
exports.REQUEST_CONTEXT_METADATA_KEY = 'x-request-context';
/**
 * Serializes a RequestContext into a base64-encoded JSON string to inject into gRPC metadata.
 */
function serializeRequestContext(ctx) {
    const json = JSON.stringify(context_1.RequestContext.toJSON(ctx));
    return Buffer.from(json).toString('base64');
}
/**
 * Deserializes a RequestContext from a base64-encoded JSON string in gRPC metadata.
 * Returns null if not present.
 */
function deserializeRequestContext(metadata) {
    const vals = metadata.get(exports.REQUEST_CONTEXT_METADATA_KEY);
    if (!vals || vals.length === 0) {
        return null;
    }
    const raw = vals[0];
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    return context_1.RequestContext.fromJSON(JSON.parse(decoded));
}
/**
 * Business Authorization helper.
 * Enforces tenant isolation: USER context MUST match the targetMerchantId.
 */
function requireMerchant(reqCtx, targetMerchantId) {
    if (!reqCtx) {
        throw Object.assign(new Error('Missing request context for business authorization'), {
            code: grpc.status.INTERNAL,
        });
    }
    if (reqCtx.authType === 'USER') {
        if (reqCtx.merchantId !== targetMerchantId) {
            throw Object.assign(new Error(`Unauthorized tenant access: user belongs to merchant ${reqCtx.merchantId}, requested ${targetMerchantId}`), { code: grpc.status.PERMISSION_DENIED });
        }
    }
}
// ─── Identity ────────────────────────────────────────────────────────────────
/**
 * Extracts SPIFFE identity from a gRPC call.
 */
function extractIdentity(call) {
    const socket = call.call?.stream?.session?.socket;
    if (!socket) {
        throw new Error('TLS socket not found in request context. Is mTLS enabled?');
    }
    const cert = socket.getPeerCertificate();
    if (!cert || Object.keys(cert).length === 0) {
        throw new Error('Client certificate not found');
    }
    const san = cert.subjectaltname;
    if (!san) {
        throw new Error('No Subject Alternative Name (SAN) found in certificate');
    }
    const uris = san.split(', ').filter(s => s.startsWith('URI:spiffe://'));
    if (uris.length === 0) {
        throw new Error('No SPIFFE URI found in certificate SAN');
    }
    if (uris.length > 1) {
        throw new Error('Multiple SPIFFE URIs found in certificate');
    }
    const spiffeUri = uris[0].replace('URI:', '');
    const url = new URL(spiffeUri);
    if (url.hostname !== 'payment-gateway') {
        throw new Error(`Invalid SPIFFE trust domain: ${url.hostname}`);
    }
    const parts = url.pathname.replace(/^\/|\/$/g, '').split('/');
    if (parts.length !== 4 || parts[0] !== 'ns' || parts[2] !== 'sa') {
        throw new Error(`Invalid SPIFFE path format: ${url.pathname}`);
    }
    return {
        environment: parts[1],
        serviceName: parts[3]
    };
}
// ─── TLS Credential Factories ─────────────────────────────────────────────────
function createServerCredentials(caCertPath, serverCertPath, serverKeyPath) {
    const caCert = fs.readFileSync(caCertPath);
    const serverCert = fs.readFileSync(serverCertPath);
    const serverKey = fs.readFileSync(serverKeyPath);
    return grpc.ServerCredentials.createSsl(caCert, [{
            cert_chain: serverCert,
            private_key: serverKey
        }], true);
}
function createClientCredentials(caCertPath, clientCertPath, clientKeyPath) {
    const caCert = fs.readFileSync(caCertPath);
    const clientCert = fs.readFileSync(clientCertPath);
    const clientKey = fs.readFileSync(clientKeyPath);
    return grpc.credentials.createSsl(caCert, clientKey, clientCert);
}
// ─── Interceptor ─────────────────────────────────────────────────────────────
function applyAuthInterceptor(handler, policy, fullMethod) {
    return (call, callback) => {
        let identity;
        try {
            identity = extractIdentity(call);
        }
        catch (err) {
            callback({ code: grpc.status.UNAUTHENTICATED, message: `authentication failed: ${err.message}` }, null);
            return;
        }
        if (!policy(identity, fullMethod)) {
            callback({ code: grpc.status.PERMISSION_DENIED, message: `service ${identity.serviceName} is not authorized to call ${fullMethod}` }, null);
            return;
        }
        // Extract and validate RequestContext
        const reqCtx = deserializeRequestContext(call.metadata);
        if (reqCtx && reqCtx.callerService && reqCtx.callerService !== identity.serviceName) {
            callback({ code: grpc.status.PERMISSION_DENIED, message: `context spoofing detected: caller_service ${reqCtx.callerService} does not match SPIFFE identity ${identity.serviceName}` }, null);
            return;
        }
        // Attach context to call object for business handlers
        call.requestContext = reqCtx;
        handler(call, callback);
    };
}
