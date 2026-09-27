"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("../dist/index.js");
var API_KEY = process.env.API_KEY;
var PROVIDER_ID = process.env.PROVIDER_ID;
if (!API_KEY || !PROVIDER_ID) {
    console.error("Missing API_KEY or PROVIDER_ID environment variables.");
    process.exit(1);
}
var gateway = new index_js_1.PaymentGateway(API_KEY, {
    baseUrl: 'http://localhost:8084/api/v1' // Pointing to local payment-service
});
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var payment, publicDetails, fakePayload, fakeSecret, crypto_1, signature, isValid, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Node.js SDK Quickstart E2E ===");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    console.log("1. Creating a payment...");
                    return [4 /*yield*/, gateway.payments.create({
                            merchantReference: "sdk-test-".concat(Date.now()),
                            amount: 7500,
                            currency: "ETB",
                            paymentMethod: "TELEBIRR",
                            providerId: PROVIDER_ID
                        })];
                case 2:
                    payment = _a.sent();
                    console.log("\u2705 Payment created! ID: ".concat(payment.id, ", Status: ").concat(payment.status));
                    console.log("2. Verifying public checkout details...");
                    return [4 /*yield*/, gateway.payments.getPublicDetails(payment.id)];
                case 3:
                    publicDetails = _a.sent();
                    console.log("\u2705 Public checkout details fetched:", publicDetails);
                    console.log("3. Testing webhook signature verification...");
                    fakePayload = JSON.stringify({ event: "payment.succeeded", paymentId: payment.id });
                    fakeSecret = "whsec_supersecret";
                    crypto_1 = require('crypto');
                    signature = crypto_1.createHmac('sha256', fakeSecret).update(fakePayload, 'utf8').digest('hex');
                    isValid = gateway.webhooks.verifySignature(fakePayload, signature, fakeSecret);
                    console.log("\u2705 Webhook signature valid: ".concat(isValid));
                    console.log("=== SDK Test Completed Successfully ===");
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("❌ SDK Error:");
                    if (error_1 instanceof index_js_1.GatewayError) {
                        console.error("Code: ".concat(error_1.code));
                        console.error("Message: ".concat(error_1.message));
                    }
                    else {
                        console.error(error_1);
                    }
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
main();
