// Generates a mock payment payload
export function generatePaymentPayload(merchantId = "merch_12345") {
    const amount = Math.floor(Math.random() * 10000) + 100; // Between $1.00 and $100.00
    
    return JSON.stringify({
        merchantReference: `ref_${__VU}_${__ITER}_${Date.now()}`,
        amount: amount,
        currency: "USD",
        customerId: `cust_${__VU}_${__ITER}`,
        ipAddress: "192.168.1.1",
        paymentMethod: "CARD",
        providerId: "00000000-0000-0000-0000-000000000001"
    });
}
