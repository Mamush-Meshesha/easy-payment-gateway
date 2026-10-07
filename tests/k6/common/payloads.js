// Generates a mock payment payload
export function generatePaymentPayload(merchantId = "merch_12345") {
    const amount = Math.floor(Math.random() * 10000) + 100; // Between $1.00 and $100.00
    
    return JSON.stringify({
        merchant_id: merchantId,
        amount: amount,
        currency: "USD",
        payment_method: {
            type: "card",
            // Simulating a test card
            card_number: `424242424242424${Math.floor(Math.random() * 9)}`,
            exp_month: 12,
            exp_year: 2028,
            cvc: "123"
        },
        billing_details: {
            name: "Load Test User",
            email: `load.test.${__VU}.${__ITER}@example.com`
        },
        metadata: {
            source: "k6-load-test"
        }
    });
}
