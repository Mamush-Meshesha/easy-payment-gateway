import { PaymentGateway, GatewayError } from '../dist/index.js';

const API_KEY = process.env.API_KEY;
const PROVIDER_ID = process.env.PROVIDER_ID;

if (!API_KEY || !PROVIDER_ID) {
  console.error("Missing API_KEY or PROVIDER_ID environment variables.");
  process.exit(1);
}

const gateway = new PaymentGateway(API_KEY, {
  baseUrl: 'http://localhost:8084/api/v1' // Pointing to local payment-service
});

async function main() {
  console.log("=== Node.js SDK Quickstart E2E ===");
  try {
    console.log("1. Creating a payment...");
    const payment = await gateway.payments.create({
      merchantReference: `sdk-test-${Date.now()}`,
      amount: 7500,
      currency: "ETB",
      paymentMethod: "TELEBIRR",
      providerId: PROVIDER_ID
    });

    console.log(`✅ Payment created! ID: ${payment.id}, Status: ${payment.status}`);

    console.log("2. Verifying public checkout details...");
    const publicDetails = await gateway.payments.getPublicDetails(payment.id);
    console.log(`✅ Public checkout details fetched:`, publicDetails);

    console.log("3. Testing webhook signature verification...");
    const fakePayload = JSON.stringify({ event: "payment.succeeded", paymentId: payment.id });
    const fakeSecret = "whsec_supersecret";
    
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', fakeSecret).update(fakePayload, 'utf8').digest('hex');
    
    const isValid = gateway.webhooks.verifySignature(fakePayload, signature, fakeSecret);
    console.log(`✅ Webhook signature valid: ${isValid}`);
    
    console.log("=== SDK Test Completed Successfully ===");
  } catch (error: any) {
    console.error("❌ SDK Error:");
    if (error instanceof GatewayError) {
      console.error(`Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
